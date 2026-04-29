import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductRecipe } from './entities/product-recipe.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Addon } from './entities/addon.entity';
import { ProductAddon } from './entities/product-addon.entity';
import { ModifierGroup } from './entities/modifier-group.entity';
import { ModifierOption } from './entities/modifier-option.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { StoresModule } from '../stores/stores.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, ProductRecipe, ProductVariant, Addon, ProductAddon, ModifierGroup, ModifierOption, InventoryItem]),
        StoresModule,
    ],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService],
})
export class ProductsModule { }
