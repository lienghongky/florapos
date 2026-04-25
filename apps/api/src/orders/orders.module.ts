import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemAddon } from './entities/order-item-addon.entity';
import { PosSession } from './entities/pos-session.entity';
import { Payment } from './entities/payment.entity';
import { Discount } from './entities/discount.entity';
import { AppliedDiscount } from './entities/applied-discount.entity';
import { StoresModule } from '../stores/stores.module';
import { Product } from '../products/entities/product.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryHistory } from '../inventory/entities/inventory-history.entity';
import { ExpensesModule } from '../expenses/expenses.module';
import { InventoryModule } from '../inventory/inventory.module';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderItem,
            OrderItemAddon,
            PosSession,
            Payment,
            Discount,
            AppliedDiscount,
            Product,
            InventoryItem,
            InventoryHistory,
            User,
        ]),
        StoresModule,
        ExpensesModule,
        InventoryModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule { }
