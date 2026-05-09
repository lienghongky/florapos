import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmenuService } from './emenu.service';
import { EmenuController } from './emenu.controller';
import { EmenuSetting } from './entities/emenu-setting.entity';
import { EmenuProduct } from './entities/emenu-product.entity';
import { Store } from '../stores/entities/store.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([EmenuSetting, EmenuProduct, Store, Product, InventoryItem]),
        OrdersModule
    ],
    controllers: [EmenuController],
    providers: [EmenuService],
    exports: [EmenuService],
})
export class EmenuModule {}
