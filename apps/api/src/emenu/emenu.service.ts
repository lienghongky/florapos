import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmenuSetting } from './entities/emenu-setting.entity';
import { UpdateEmenuSettingDto } from './dto/update-emenu-setting.dto';
import { Store } from '../stores/entities/store.entity';
import { Product } from '../products/entities/product.entity';
import { ProductRecipe } from '../products/entities/product-recipe.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { EmenuProduct } from './entities/emenu-product.entity';
import { In } from 'typeorm';

@Injectable()
export class EmenuService {
    constructor(
        @InjectRepository(EmenuSetting)
        private emenuSettingRepository: Repository<EmenuSetting>,
        @InjectRepository(EmenuProduct)
        private emenuProductRepository: Repository<EmenuProduct>,
        @InjectRepository(Store)
        private storeRepository: Repository<Store>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(InventoryItem)
        private inventoryRepository: Repository<InventoryItem>,
    ) {}

    async getSettings(storeId: string): Promise<EmenuSetting> {
        let setting = await this.emenuSettingRepository.findOne({ where: { store_id: storeId } });
        
        if (!setting) {
            // Create default setting if it doesn't exist
            const store = await this.storeRepository.findOne({ where: { id: storeId } });
            if (!store) {
                throw new NotFoundException('Store not found');
            }
            setting = this.emenuSettingRepository.create({ store_id: storeId });
            await this.emenuSettingRepository.save(setting);
        }
        
        return setting;
    }

    async updateSettings(storeId: string, updateDto: UpdateEmenuSettingDto): Promise<EmenuSetting> {
        const setting = await this.getSettings(storeId);
        
        Object.assign(setting, updateDto);
        return this.emenuSettingRepository.save(setting);
    }

    async getPublicEmenu(storeId: string) {
        const store = await this.storeRepository.findOne({ where: { id: storeId } });
        if (!store) {
            throw new NotFoundException('Store not found');
        }

        const settings = await this.getSettings(storeId);
        
        if (!settings.is_enabled) {
            throw new NotFoundException('E-Menu is not enabled for this store');
        }

        // Fetch visible product IDs from EmenuProduct table
        const emenuProducts = await this.emenuProductRepository.find({
            where: { store_id: storeId }
        });
        const productIds = emenuProducts.map(ep => ep.product_id);

        if (productIds.length === 0) {
            return {
                store: {
                    id: store.id,
                    name: store.name,
                    currency: store.currency,
                    address: store.address,
                    phone_number: store.phone_number,
                    banner_image: settings.banner_image || store.banner_image,
                    logo_url: store.logo_url,
                    description: store.description,
                },
                settings,
                products: [],
            };
        }

        const products = await this.productRepository.find({
            where: {
                id: In(productIds),
                store_id: storeId,
                is_active: true,
            },
            relations: ['category', 'variants', 'product_addons', 'modifier_groups', 'modifier_groups.options', 'recipe', 'recipe.inventory_item'],
        });

        const productsWithStock = await Promise.all(products.map(async (product) => {
            let calculated_stock = 999999;
            if (product.track_inventory) {
                if (product.recipe && product.recipe.length > 0) {
                    const availability = await this.calculateCompositeAvailability(product.recipe);
                    calculated_stock = availability.available_quantity;
                } else {
                    calculated_stock = 0;
                }
            }

            const is_out_of_stock = product.track_inventory && !product.allow_negative_stock && (calculated_stock <= 0);

            return {
                ...product,
                calculated_stock,
                is_out_of_stock,
            };
        }));

        return {
            store: {
                id: store.id,
                name: store.name,
                currency: store.currency,
                address: store.address,
                phone_number: store.phone_number,
                banner_image: settings.banner_image || store.banner_image,
                logo_url: store.logo_url,
                description: store.description,
            },
            settings,
            products: productsWithStock,
        };
    }

    private async calculateCompositeAvailability(recipe: ProductRecipe[]): Promise<{
        available_quantity: number;
    }> {
        if (!recipe || recipe.length === 0) return { available_quantity: 0 };

        let minAvailable = Infinity;

        for (const recipeItem of recipe) {
            const ingredient = recipeItem.inventory_item || await this.inventoryRepository.findOne({
                where: { id: recipeItem.inventory_item_id }
            });

            if (!ingredient) continue;

            const currentStock = Number(ingredient.current_stock);
            const quantityNeeded = Number(recipeItem.quantity_required);

            if (quantityNeeded === 0) continue;

            const possibleUnits = Math.floor(currentStock / quantityNeeded);

            if (possibleUnits < minAvailable) {
                minAvailable = possibleUnits;
            }
        }

        return {
            available_quantity: minAvailable === Infinity ? 0 : minAvailable,
        };
    }
    async getVisibleProductIds(storeId: string): Promise<string[]> {
        const items = await this.emenuProductRepository.find({
            where: { store_id: storeId },
            select: ['product_id']
        });
        return items.map(i => i.product_id);
    }

    async addProductToEmenu(storeId: string, productId: string) {
        const existing = await this.emenuProductRepository.findOne({
            where: { store_id: storeId, product_id: productId }
        });
        if (!existing) {
            const newItem = this.emenuProductRepository.create({ store_id: storeId, product_id: productId });
            await this.emenuProductRepository.save(newItem);
        }
        return { success: true };
    }

    async removeProductFromEmenu(storeId: string, productId: string) {
        await this.emenuProductRepository.delete({ store_id: storeId, product_id: productId });
        return { success: true };
    }
}
