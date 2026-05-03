import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Between, ILike, MoreThanOrEqual, LessThanOrEqual, Not } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemAddon } from './entities/order-item-addon.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, UpdatePaymentStatusDto } from './dto/update-order.dto';
import { StoresService } from '../stores/stores.service';
import { Product } from '../products/entities/product.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryActionType } from '../inventory/entities/inventory-history.entity';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../telegram/events/order-created.event';

@Injectable()
export class OrdersService {

    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepository: Repository<OrderItem>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(InventoryItem)
        private inventoryRepository: Repository<InventoryItem>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private inventoryService: InventoryService,
        private storesService: StoresService,
        private dataSource: DataSource,
        private eventEmitter: EventEmitter2,
    ) { }

    async create(userId: string, createDto: CreateOrderDto): Promise<Order> {
        await this.storesService.findOne(userId, createDto.store_id);
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const salespersonName = user ? (user.full_name || user.email) : 'System';

        const result = await this.dataSource.transaction(async (manager) => {
            const productIds = createDto.items.map(item => item.product_id);
            const products = await manager.find(Product, {
                where: { id: In(productIds) },
                relations: ['recipe', 'recipe.inventory_item'],
            });

            let subtotal = 0;
            const orderItems: any[] = [];

            for (const itemDto of createDto.items) {
                const product = products.find(p => p.id === itemDto.product_id);
                if (!product) throw new BadRequestException(`Product ${itemDto.product_id} not found`);

                const unitPrice = Number(product.base_price);
                let itemSubtotal = unitPrice * itemDto.quantity;

                // add addons total
                const addonsData = [];
                if (itemDto.addons) {
                    for (const addon of itemDto.addons) {
                         const addonPrice = Number(addon.price);
                         itemSubtotal += addonPrice * itemDto.quantity;
                         addonsData.push({
                             name_snapshot: addon.name_snapshot,
                             price: addonPrice,
                             addon_id: addon.addon_id,
                             modifier_group_id: addon.modifier_group_id,
                             modifier_option_id: addon.modifier_option_id,
                             quantity: 1
                         });
                    }
                }
                
                subtotal += itemSubtotal;

                orderItems.push({
                    product,
                    product_id: product.id,
                    variant_id: itemDto.variant_id,
                    product_name_snapshot: product.name,
                    quantity: itemDto.quantity,
                    unit_price: unitPrice,
                    line_total: itemSubtotal,
                    notes: itemDto.notes,
                    addonsData,
                });
            }

            const taxRate = createDto.tax_rate || 0;
            const taxAmount = subtotal * (taxRate / 100);
            const deliveryFee = createDto.delivery_fee || 0;
            const discountAmount = createDto.discount_amount || 0;
            const grandTotal = subtotal + taxAmount + deliveryFee - discountAmount;

            const { items, ...orderData } = createDto;
            
            // Generate sequential order number with a lock to prevent race conditions
            const store = await manager.findOne(Store, { 
                where: { id: createDto.store_id },
                lock: { mode: 'pessimistic_write' }
            });
            
            const nextNum = store?.invoice_next_number || 1;
            const prefix = store?.invoice_prefix || '';
            let orderNumber = `${prefix}${nextNum.toString().padStart(5, '0')}`;

            // Collision check: if the number already exists, append a unique suffix
            // We use a random suffix to ensure uniqueness in the DB while keeping the display version clean
            const existingOrder = await manager.findOne(Order, { 
                where: { store_id: createDto.store_id, order_number: orderNumber } 
            });
            
            if (existingOrder) {
                const suffix = Math.random().toString(36).substring(2, 6); // 4-char random string
                orderNumber = `${orderNumber}$$${suffix}`;
            }

            // Increment the next number for the store
            if (store) {
                store.invoice_next_number = nextNum + 1;
                await manager.save(store);
            }

            const order = manager.create(Order, {
                ...orderData,
                order_number: orderNumber,
                subtotal,
                tax_total: taxAmount,
                discount_total: discountAmount,
                grand_total: grandTotal,
                staff_name: salespersonName,
                staff_id: orderData.staff_id || userId,
            });
            const savedOrder = await manager.save(order);

            for (const itemData of orderItems) {
                const item = manager.create(OrderItem, {
                    order_id: savedOrder.id,
                    product_id: itemData.product_id,
                    variant_id: itemData.variant_id,
                    product_name_snapshot: itemData.product_name_snapshot,
                    quantity: itemData.quantity,
                    unit_price: itemData.unit_price,
                    line_total: itemData.line_total,
                    notes: itemData.notes,
                });
                const savedItem = await manager.save(item);

                if (itemData.addonsData.length > 0) {
                     const addons = itemData.addonsData.map((a: any) => manager.create(OrderItemAddon, {
                          order_item_id: savedItem.id,
                          ...a
                     }));
                     await manager.save(addons);
                }

                // Inventory Deduction Logic
                const product = itemData.product;
                if (product.track_inventory) {
                    // Check if it's a composite product or simple
                    if (product.recipe && product.recipe.length > 0) {
                        // Composite Product: Deduct each item in recipe
                        for (const recipeItem of product.recipe) {
                            const invItem = recipeItem.inventory_item;
                            if (invItem) {
                                const totalDeduction = (Number(recipeItem.quantity_required) || 0) * (itemData.quantity || 0);
                                const previousStock = Number(invItem.current_stock) || 0;
                                const newStock = previousStock - totalDeduction;

                                if (newStock < 0 && !product.allow_negative_stock) {
                                    throw new BadRequestException(`Insufficient stock for ingredient: ${invItem.name}`);
                                }


                                invItem.current_stock = newStock;
                                await manager.save(invItem);

                                // Log History as COMPOSITE_DEDUCTION
                                await this.inventoryService.createHistoryEntry(manager, {
                                    store_id: invItem.store_id,
                                    inventory_item_id: invItem.id,
                                    action_type: InventoryActionType.COMPOSITE_DEDUCTION,
                                    quantity_change: -totalDeduction,
                                    quantity_before: previousStock,
                                    quantity_after: newStock,
                                    reference_id: savedOrder.id,
                                    reference_type: 'sale',
                                    performed_by_user_id: userId,
                                    notes: `Recipe for ${product.name} (Order #${savedOrder.order_number})`,
                                });
                            }
                        }
                    } else {
                        // Simple Product: Deduct from inventory item matching product name/SKU
                        const invItem = await manager.findOne(InventoryItem, {
                            where: { store_id: createDto.store_id, name: product.name }
                        });

                        if (invItem) {
                            const previousStock = Number(invItem.current_stock) || 0;
                            const deductionQty = Number(itemData.quantity) || 0;
                            const newStock = previousStock - deductionQty;

                            if (newStock < 0 && !product.allow_negative_stock) {
                                throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
                            }


                            invItem.current_stock = newStock;
                            await manager.save(invItem);

                            // Log History as SALE
                            await this.inventoryService.createHistoryEntry(manager, {
                                store_id: invItem.store_id,
                                inventory_item_id: invItem.id,
                                action_type: InventoryActionType.SALE,
                                quantity_change: -itemData.quantity,
                                quantity_before: previousStock,
                                quantity_after: newStock,
                                reference_id: savedOrder.id,
                                reference_type: 'sale',
                                performed_by_user_id: userId,
                                notes: `Sale: ${product.name} (Order #${savedOrder.order_number})`,
                            });
                        }
                    }
                }
            }

            const finalOrder = await manager.findOne(Order, {
                where: { id: savedOrder.id },
                relations: ['items', 'items.addons', 'items.product'],
            });

            return finalOrder as any;
        });

        // Emit event for Telegram notifications (fire-and-forget, non-blocking)
        this.eventEmitter.emit('order.created', new OrderCreatedEvent({
            store_id: createDto.store_id,
            order_id: result.id,
            order_number: result.order_number,
            grand_total: Number(result.grand_total),
            staff_name: salespersonName,
            item_count: createDto.items.length,
            payment_method: createDto.payment_method || 'N/A',
            items: result.items.map((item: any) => ({
                name: item.product?.name || 'Unknown Item',
                image_url: item.product?.image_url,
            })),
        }));

        return result;
    }

    async findAll(
        userId: string,
        storeId: string,
        status?: string,
        startDate?: string,
        endDate?: string,
        search?: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ items: Order[], count: number }> {
        const where: any = { store_id: storeId };

        if (status) {
            if (status === 'active') {
                where.status = Not(In(['completed', 'cancelled']));
            } else {
                where.status = status;
            }
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.created_at = Between(start, end);
        } else if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            where.created_at = MoreThanOrEqual(start);
        } else if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.created_at = LessThanOrEqual(end);
        }

        if (search) {
            where.order_number = ILike(`%${search}%`);
        }

        const p = Math.max(1, Number(page) || 1);
        const l = Math.max(1, Number(limit) || 10);

        const [items, count] = await this.orderRepository.findAndCount({
            where,
            relations: ['items', 'items.addons', 'items.product'],
            order: { created_at: 'DESC' },
            skip: (p - 1) * l,
            take: l
        });

        return { items, count };
    }

    async getStats(userId: string, storeId: string, startDate?: string, endDate?: string): Promise<any> {
        const where: any = { store_id: storeId, status: OrderStatus.COMPLETED };
        
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Default to end of month for the chart/range if not provided
        const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        if (startDate) start.setHours(0, 0, 0, 0);
        if (endDate) end.setHours(23, 59, 59, 999);
        else end.setHours(23, 59, 59, 999); // Always end at end of day

        // Duration for trend
        const duration = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - duration);
        const prevEnd = new Date(end.getTime() - duration);

        const [currentOrders, previousOrders] = await Promise.all([
            this.orderRepository.find({
                where: { ...where, created_at: Between(start, end) }
            }),
            this.orderRepository.find({
                where: { ...where, created_at: Between(prevStart, prevEnd) }
            })
        ]);

        const totalRevenue = currentOrders.reduce((sum, o) => sum + Number(o.grand_total), 0);
        const prevRevenue = previousOrders.reduce((sum, o) => sum + Number(o.grand_total), 0);
        
        const totalOrders = currentOrders.length;
        const prevOrders = previousOrders.length;

        const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const ordersTrend = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;

        // Daily chart data
        const chartDataMap: Record<string, number> = {};
        const days = Math.floor(duration / (1000 * 60 * 60 * 24)) + 1;
        
        for (let i = 0; i < days; i++) {
            const d = new Date(start.getTime() + (i * 1000 * 60 * 60 * 24));
            const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            chartDataMap[dStr] = 0;
        }

        currentOrders.forEach(o => {
            const d = new Date(o.created_at);
            const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (chartDataMap[dStr] !== undefined) {
                chartDataMap[dStr] += Number(o.grand_total);
            }
        });

        // Calculate Today's Stats specifically
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        const todayOrdersList = currentOrders.filter(o => {
            const d = new Date(o.created_at);
            return d >= todayStart && d <= todayEnd;
        });
        
        const todayRevenue = todayOrdersList.reduce((sum, o) => sum + Number(o.grand_total), 0);
        const todayOrders = todayOrdersList.length;

        const chartData = Object.entries(chartDataMap).map(([dateStr, sales]) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            const label = new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            return { date: label, sales };
        });

        // Top Products
        const topProducts = await this.orderItemRepository
            .createQueryBuilder('item')
            .leftJoin('item.order', 'order')
            .leftJoin('item.product', 'product')
            .select('product.name', 'name')
            .addSelect('SUM(item.quantity)', 'quantity')
            .addSelect('SUM(item.line_total)', 'revenue')
            .where('order.store_id = :storeId', { storeId })
            .andWhere('order.status = :status', { status: OrderStatus.COMPLETED })
            .andWhere('order.created_at BETWEEN :start AND :end', { start, end })
            .groupBy('product.id')
            .addGroupBy('product.name')
            .orderBy('quantity', 'DESC')
            .limit(5)
            .getRawMany();

        // Category Breakdown
        const categoryStats = await this.orderItemRepository
            .createQueryBuilder('item')
            .leftJoin('item.order', 'order')
            .leftJoin('item.product', 'product')
            .leftJoin('product.category', 'category')
            .select('COALESCE(category.name, \'Uncategorized\')', 'name')
            .addSelect('SUM(item.line_total)', 'value')
            .where('order.store_id = :storeId', { storeId })
            .andWhere('order.status = :status', { status: OrderStatus.COMPLETED })
            .andWhere('order.created_at BETWEEN :start AND :end', { start, end })
            .groupBy('category.id')
            .addGroupBy('category.name')
            .getRawMany();

        // Weekday Breakdown (Current Week)
        const weekStart = new Date();
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(weekStart.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const weekOrders = await this.orderRepository.find({
            where: { store_id: storeId, status: OrderStatus.COMPLETED, created_at: Between(monday, sunday) }
        });

        const weekdayMap: Record<string, number> = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
        const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        weekOrders.forEach(o => {
            const dName = weekdayNames[new Date(o.created_at).getDay()];
            if (weekdayMap[dName] !== undefined) weekdayMap[dName] += Number(o.grand_total);
        });

        const weekdayStats = Object.entries(weekdayMap).map(([name, value]) => ({ name, value }));

        return {
            total_revenue: totalRevenue,
            total_orders: totalOrders,
            avg_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            revenue_trend: revenueTrend,
            orders_trend: ordersTrend,
            today_revenue: todayRevenue,
            today_orders: todayOrders,
            chart_data: chartData,
            top_products: topProducts.map(p => ({
                name: p.name,
                quantity: Number(p.quantity),
                revenue: Number(p.revenue)
            })),
            category_stats: categoryStats.map(c => ({
                name: c.name,
                value: Number(c.value)
            })),
            weekday_stats: weekdayStats
        };
    }

    async getRecent(userId: string, storeId: string, limit: number = 5): Promise<Order[]> {
         return this.orderRepository.find({
             where: { store_id: storeId },
             order: { created_at: 'DESC' },
             take: limit,
             relations: ['items', 'items.product']
         });
    }

    async findOne(userId: string, id: string): Promise<Order> {
          return this.orderRepository.findOneOrFail({ where: { id }, relations: ['items', 'items.addons', 'items.product']});
    }

    async updateStatus(userId: string, id: string, updateDto: UpdateOrderStatusDto): Promise<Order> {
        return this.dataSource.transaction(async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id },
                relations: ['items', 'items.product', 'items.product.recipe', 'items.product.recipe.inventory_item']
            });

            if (!order) throw new NotFoundException('Order not found');

            const oldStatus = order.status;
            const newStatus = updateDto.status as OrderStatus;

            // Restoration Logic: If status changes TO cancelled FROM PENDING (only pending orders get restocked)
            if (newStatus === OrderStatus.CANCELLED && oldStatus === OrderStatus.PENDING) {
                for (const item of order.items) {
                    const product = item.product;
                    if (product && product.track_inventory) {
                        // Check if it's a composite product or simple
                        if (product.recipe && product.recipe.length > 0) {
                            // Composite Product: Restore each item in recipe
                            for (const recipeItem of product.recipe) {
                                const invItem = recipeItem.inventory_item;
                                if (invItem) {
                                    const totalRestoration = (Number(recipeItem.quantity_required) || 0) * (item.quantity || 0);
                                    const previousStock = Number(invItem.current_stock) || 0;
                                    const newStock = previousStock + totalRestoration;

                                    invItem.current_stock = newStock;
                                    await manager.save(invItem);


                                    // Log History as RESTOCK
                                    await this.inventoryService.createHistoryEntry(manager, {
                                        store_id: invItem.store_id,
                                        inventory_item_id: invItem.id,
                                        action_type: InventoryActionType.RESTOCK,
                                        quantity_change: totalRestoration,
                                        quantity_before: previousStock,
                                        quantity_after: newStock,
                                        reference_id: order.id,
                                        reference_type: 'sale_cancel',
                                        performed_by_user_id: userId,
                                        notes: `Restored: Recipe for ${product.name} (Cancelled Order #${order.order_number})`,
                                    });
                                }
                            }
                        } else {
                            // Simple Product: Restore to inventory item matching product name
                            const invItem = await manager.findOne(InventoryItem, {
                                where: { store_id: order.store_id, name: product.name }
                            });

                            if (invItem) {
                                const previousStock = Number(invItem.current_stock) || 0;
                                const restorationQuantity = Number(item.quantity) || 0;
                                const newStock = previousStock + restorationQuantity;

                                invItem.current_stock = newStock;
                                await manager.save(invItem);

                                // Log History as RESTOCK
                                await this.inventoryService.createHistoryEntry(manager, {
                                    store_id: invItem.store_id,
                                    inventory_item_id: invItem.id,
                                    action_type: InventoryActionType.RESTOCK,
                                    quantity_change: restorationQuantity,
                                    quantity_before: previousStock,
                                    quantity_after: newStock,
                                    reference_id: order.id,
                                    reference_type: 'sale_cancel',
                                    performed_by_user_id: userId,
                                    notes: `Restored: ${product.name} (Cancelled Order #${order.order_number})`,
                                });
                            }
                        }
                    }
                }
            }

            order.status = newStatus;
            return manager.save(order);
        });
    }

    async updatePaymentStatus(userId: string, id: string, updateDto: UpdatePaymentStatusDto): Promise<Order> {
       const order = await this.findOne(userId, id);
       if (!order) throw new NotFoundException('Order not found');

       if (updateDto.payment_method) {
           order.payment_method = updateDto.payment_method;
       }

       // We no longer auto-transition to COMPLETED here.
       // The staff will manually set the status when the order is physically finished.

       return this.orderRepository.save(order);
    }
}
