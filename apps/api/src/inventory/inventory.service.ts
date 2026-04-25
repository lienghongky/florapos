import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryHistory, InventoryActionType } from './entities/inventory-history.entity';
import { Product } from '../products/entities/product.entity';
import { ProductRecipe } from '../products/entities/product-recipe.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateStockDto, AdjustmentType } from './dto/update-stock.dto';
import { StoresService } from '../stores/stores.service';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(InventoryItem)
        private inventoryRepository: Repository<InventoryItem>,
        @InjectRepository(InventoryHistory)
        private historyRepository: Repository<InventoryHistory>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(ProductRecipe)
        private recipeRepository: Repository<ProductRecipe>,
        private storesService: StoresService,
        private dataSource: DataSource,
    ) { }

    async create(userId: string, createDto: CreateInventoryItemDto): Promise<InventoryItem> {
        await this.storesService.findOne(userId, createDto.store_id);
        const item = this.inventoryRepository.create(createDto);
        return this.inventoryRepository.save(item);
    }

    async adjustStock(userId: string, itemId: string, updateDto: UpdateStockDto): Promise<InventoryItem> {
        const item = await this.inventoryRepository.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Inventory Item not found');

        // Verify Access
        await this.storesService.findOne(userId, item.store_id);

        const previousStock = Number(item.current_stock);
        let newStock: number;
        let change: number;

        // Handle different adjustment types
        if (updateDto.type === AdjustmentType.SET) {
            newStock = updateDto.quantity;
            change = newStock - previousStock;
        } else {
            change = updateDto.type === AdjustmentType.INCREASE ? updateDto.quantity : -updateDto.quantity;
            newStock = previousStock + change;
        }

        if (newStock < 0) throw new BadRequestException('Insufficient stock');

        return this.dataSource.transaction(async (manager) => {
            item.current_stock = newStock;
            const savedItem = await manager.save(item);

            // Log History
            await this.createHistoryEntry(manager, {
                store_id: item.store_id,
                inventory_item_id: item.id,
                action_type: InventoryActionType.ADJUSTMENT,
                quantity_change: change,
                quantity_before: previousStock,
                quantity_after: newStock,
                notes: updateDto.reason,
                performed_by_user_id: userId,
            });

            return savedItem;
        });
    }

    async createHistoryEntry(
        manager: any, // Use any or EntityManager
        data: {
            store_id: string;
            inventory_item_id: string;
            action_type: InventoryActionType;
            quantity_change: number;
            quantity_before: number;
            quantity_after: number;
            reference_id?: string;
            reference_type?: string;
            performed_by_user_id?: string;
            notes?: string;
        }
    ): Promise<void> {
        const history = manager.create(InventoryHistory, {
            ...data,
            timestamp: new Date(),
        });
        await manager.save(history);
    }

    async getSummary(userId: string, storeId: string): Promise<any> {
        await this.storesService.findOne(userId, storeId);

        const items = await this.inventoryRepository.find({ where: { store_id: storeId } });

        const summary = {
            total_products: items.length,
            low_stock_count: items.filter(item =>
                Number(item.current_stock) > 0 &&
                Number(item.current_stock) <= Number(item.min_stock_threshold)
            ).length,
            out_of_stock_count: items.filter(item => Number(item.current_stock) === 0).length,
            estimated_value: items.reduce((sum, item) =>
                sum + (Number(item.current_stock) * Number(item.cost_price)), 0
            ),
        };

        return summary;
    }
    async getHistory(
        userId: string,
        itemId: string,
        actionType?: string,
        search?: string,
    ): Promise<InventoryHistory[]> {
        const item = await this.inventoryRepository.findOne({ where: { id: itemId } });
        if (!item) throw new NotFoundException('Inventory Item not found');

        await this.storesService.findOne(userId, item.store_id);

        const queryBuilder = this.historyRepository
            .createQueryBuilder('history')
            .leftJoinAndSelect('history.user', 'user')
            .where('history.inventory_item_id = :itemId', { itemId })
            .orderBy('history.timestamp', 'DESC');

        if (actionType) {
            queryBuilder.andWhere('history.action_type = :actionType', { actionType });
        }

        if (search) {
            queryBuilder.andWhere(
                '(history.reference_id LIKE :search OR history.notes LIKE :search OR user.full_name LIKE :search)',
                { search: `%${search}%` }
            );
        }

        return queryBuilder.getMany();
    }

    async getGlobalHistory(
        userId: string,
        storeId: string,
        actionType?: string,
        search?: string,
        startDate?: string,
        endDate?: string,
    ): Promise<InventoryHistory[]> {
        await this.storesService.findOne(userId, storeId);

        const queryBuilder = this.historyRepository
            .createQueryBuilder('history')
            .leftJoinAndSelect('history.item', 'item')
            .leftJoinAndSelect('history.user', 'user')
            .where('history.store_id = :storeId', { storeId })
            .orderBy('history.timestamp', 'DESC');

        if (actionType) {
            queryBuilder.andWhere('history.action_type = :actionType', { actionType });
        }

        if (search) {
            queryBuilder.andWhere(
                '(item.name LIKE :search OR history.reference_id LIKE :search OR history.notes LIKE :search OR user.full_name LIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (startDate) {
            queryBuilder.andWhere('history.timestamp >= :startDate', { startDate: new Date(startDate) });
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            queryBuilder.andWhere('history.timestamp <= :endDate', { endDate: end });
        }

        return queryBuilder.getMany();
    }

    async findByCode(userId: string, storeId: string, code: string): Promise<InventoryItem> {
        await this.storesService.findOne(userId, storeId);
        
        let item = await this.inventoryRepository.findOne({
            where: [
                { store_id: storeId, barcode: code },
                { store_id: storeId, sku: code },
                { store_id: storeId, name: code }
            ]
        });

        if (!item) {
            // Fallback: Check Products table for barcode/SKU
            const product = await this.productRepository.findOne({
                where: [
                    { store_id: storeId, barcode: code },
                    { store_id: storeId, sku: code }
                ]
            });

            if (product) {
                // Try to find inventory item by product name
                item = await this.inventoryRepository.findOne({
                    where: { store_id: storeId, name: product.name }
                });
            }
        }

        if (!item) {
            // Try fuzzy search by name if exact match fails
            const fuzzyItem = await this.inventoryRepository
                .createQueryBuilder('item')
                .where('item.store_id = :storeId', { storeId })
                .andWhere('item.name ILIKE :name', { name: `%${code}%` })
                .getOne();
            
            if (!fuzzyItem) throw new NotFoundException('Inventory Item not found');
            return fuzzyItem;
        }

        return item;
    }

    async exportInventory(userId: string, storeId: string): Promise<any[]> {
        await this.storesService.findOne(userId, storeId);

        const items = await this.inventoryRepository.find({
            where: { store_id: storeId },
            order: { name: 'ASC' },
        });

        return items.map(item => ({
            name: item.name,
            current_stock: Number(item.current_stock),
            min_stock_threshold: Number(item.min_stock_threshold),
            cost_price: Number(item.cost_price),
            unit_id: item.unit_id,
        }));
    }

    async importInventory(userId: string, storeId: string, items: any[]): Promise<{ created: number; updated: number }> {
        await this.storesService.findOne(userId, storeId);

        let created = 0;
        let updated = 0;

        for (const itemData of items) {
            const existing = await this.inventoryRepository.findOne({
                where: { store_id: storeId, name: itemData.name }
            });

            if (existing) {
                existing.current_stock = itemData.current_stock;
                existing.min_stock_threshold = itemData.min_stock_threshold;
                existing.cost_price = itemData.cost_price;
                existing.unit_id = itemData.unit_id;
                await this.inventoryRepository.save(existing);
                updated++;
            } else {
                const newItem = this.inventoryRepository.create({
                    ...itemData,
                    store_id: storeId,
                });
                await this.inventoryRepository.save(newItem);
                created++;
            }
        }

        return { created, updated };
    }

    async findAll(userId: string, storeId: string): Promise<InventoryItem[]> {
        await this.storesService.findOne(userId, storeId); // Verify access
        return this.inventoryRepository.find({ where: { store_id: storeId } });
    }

    async remove(userId: string, id: string): Promise<void> {
        const item = await this.inventoryRepository.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Inventory Item not found');

        // Verify Access
        await this.storesService.findOne(userId, item.store_id);

        // Check 1: Stocks must be zero
        if (Number(item.current_stock) > 0) {
            throw new BadRequestException('Cannot delete item with remaining stock. Please adjust stock to 0 first.');
        }

        // Check 2: Check if used in any Product Recipe
        const recipeCount = await this.recipeRepository.count({ where: { inventory_item_id: id } });
        if (recipeCount > 0) {
            throw new ConflictException('Cannot delete item because it is used in one or more product recipes. Please remove it from recipes first.');
        }

        try {
            await this.inventoryRepository.remove(item);
        } catch (error: any) {
            if (error.code === '23503') { // Postgres foreign key violation (History)
                throw new ConflictException('Cannot delete item because it has transaction history. Consider marking it as inactive instead.');
            }
            throw error;
        }
    }
}
