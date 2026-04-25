import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryHistory } from './entities/inventory-history.entity';
import { Product } from '../products/entities/product.entity';
import { ProductRecipe } from '../products/entities/product-recipe.entity';
import { StoresModule } from '../stores/stores.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([InventoryItem, InventoryHistory, Product, ProductRecipe]),
        StoresModule,
    ],
    controllers: [InventoryController],
    providers: [InventoryService],
    exports: [InventoryService],
})
export class InventoryModule { }
