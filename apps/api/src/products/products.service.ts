import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product, ProductType } from './entities/product.entity';
import { ProductRecipe } from './entities/product-recipe.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Addon } from './entities/addon.entity';
import { ProductAddon } from './entities/product-addon.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ImportProductDto } from './dto/import-product.dto';
import { StoresService } from '../stores/stores.service';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(ProductRecipe)
        private recipeRepository: Repository<ProductRecipe>,
        @InjectRepository(ProductVariant)
        private variantRepository: Repository<ProductVariant>,
        @InjectRepository(Addon)
        private addonRepository: Repository<Addon>,
        @InjectRepository(ProductAddon)
        private productAddonRepository: Repository<ProductAddon>,
        @InjectRepository(InventoryItem)
        private inventoryRepository: Repository<InventoryItem>,
        private storesService: StoresService,
        private dataSource: DataSource,
    ) { }

    async create(userId: string, createProductDto: CreateProductDto, image?: Express.Multer.File): Promise<Product> {
        this.parseJsonFields(createProductDto);
        await this.storesService.findOne(userId, createProductDto.store_id);

        if (image) {
            createProductDto.image_url = `/uploads/products/${image.filename}`;
        }


        return this.dataSource.transaction(async (manager) => {
            const product = manager.create(Product, {
                ...createProductDto,
                product_addons: undefined,
                variants: undefined,
                recipe: undefined,
            });

            // For simplistic inventory tie
            let createdInventoryItem: InventoryItem | null = null;
            if (createProductDto.product_type === ProductType.SIMPLE) {
                const inventoryItem = manager.create(InventoryItem, {
                    name: createProductDto.name,
                    store_id: createProductDto.store_id,
                    current_stock: 0,
                    cost_price: createProductDto.cost_price || 0,
                });
                createdInventoryItem = await manager.save(inventoryItem);
            }

            const savedProduct = await manager.save(product);

            if (createProductDto.product_type === ProductType.SIMPLE && createdInventoryItem) {
                 const recipe = manager.create(ProductRecipe, {
                     product_id: savedProduct.id,
                     inventory_item_id: createdInventoryItem.id,
                     quantity_required: 1,
                 });
                 await manager.save(recipe);
            } else if (createProductDto.product_type === ProductType.COMPOSITE && createProductDto.recipe) {
                const recipes = createProductDto.recipe.map(item => manager.create(ProductRecipe, {
                    product_id: savedProduct.id,
                    inventory_item_id: item.inventory_item_id,
                    quantity_required: item.quantity_required,
                }));
                await manager.save(recipes);
            }

            // Logic: Create Addons
            if (createProductDto.addons && createProductDto.addons.length > 0) {
                let displayOrder = 0;
                for (const addonDto of createProductDto.addons) {
                    const addon = manager.create(Addon, {
                        store_id: createProductDto.store_id,
                        name: addonDto.name,
                        price: addonDto.price || 0,
                        max_quantity: addonDto.max_quantity || 1,
                        required: addonDto.required || false,
                    });
                    const savedAddon = await manager.save(addon);

                    const productAddon = manager.create(ProductAddon, {
                        product_id: savedProduct.id,
                        addon_id: savedAddon.id,
                        display_order: displayOrder++,
                    });
                    await manager.save(productAddon);
                }
            }

            // Logic: Create Variants
            if (createProductDto.variants && createProductDto.variants.length > 0) {
                const variants = createProductDto.variants.map(v => manager.create(ProductVariant, {
                    product_id: savedProduct.id,
                    name: v.name,
                    price_modifier: v.price_modifier || 0,
                    cost_modifier: v.cost_modifier || 0,
                    sku: v.sku,
                    barcode: v.barcode,
                }));
                await manager.save(variants);
            }

            return savedProduct;
        });
    }

    async importProducts(userId: string, targetStoreId: string, importDto: ImportProductDto): Promise<{ imported_count: number }> {
        return { imported_count: 0 };
    }

    async findAll(userId: string, storeId: string): Promise<Product[]> {
        await this.storesService.findOne(userId, storeId);
        const products = await this.productRepository.find({
            where: { store_id: storeId },
            relations: ['recipe', 'recipe.inventory_item', 'category', 'product_addons', 'product_addons.addon', 'variants']
        });

        return Promise.all(products.map(async (product) => {
            let calculated_stock = 999999; // Default for non-tracked items
            
            if (product.track_inventory) {
                if (product.recipe && product.recipe.length > 0) {
                    const availability = await this.calculateCompositeAvailability(product.recipe);
                    calculated_stock = availability.available_quantity;
                } else {
                    // Fallback for simple untied products - though they should have recipes
                    calculated_stock = 0;
                }
            }
            
            return {
                ...product,
                calculated_stock,
            };
        }));
    }

    async findOne(userId: string, productId: string): Promise<Product> {
        const product = await this.productRepository.findOne({
            where: { id: productId },
            relations: ['recipe', 'recipe.inventory_item', 'store', 'product_addons', 'product_addons.addon', 'variants'],
        });

        if (!product) throw new NotFoundException('Product not found');
        await this.storesService.findOne(userId, product.store_id);
        return product;
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

    async update(userId: string, id: string, updateProductDto: any, image?: Express.Multer.File): Promise<Product> {
        this.parseJsonFields(updateProductDto);
        const product = await this.productRepository.findOne({ 
            where: { id },
            relations: ['store'] 
        });
        if (!product) throw new NotFoundException('Product not found');
        
        // Ensure user has access to the store
        await this.storesService.findOne(userId, product.store_id);

        return this.dataSource.transaction(async (manager) => {
            // Update basic fields
            await manager.update(Product, id, {
                name: updateProductDto.name,
                description: updateProductDto.description,
                sku: updateProductDto.sku,
                barcode: updateProductDto.barcode,
                category_id: updateProductDto.category_id,
                product_type: updateProductDto.product_type,
                pricing_type: updateProductDto.pricing_type,
                base_price: updateProductDto.base_price,
                cost_price: updateProductDto.cost_price,
                taxable: updateProductDto.taxable,
                tax_rate: updateProductDto.tax_rate,
                track_inventory: updateProductDto.track_inventory,
                allow_negative_stock: updateProductDto.allow_negative_stock,
                image_url: image ? `/uploads/products/${image.filename}` : updateProductDto.image_url,
                is_active: updateProductDto.is_active,
            });


            // Sync Recipes (Components)
            if (updateProductDto.recipe) {
                // Delete old recipes
                await manager.delete(ProductRecipe, { product_id: id });
                
                // Add new ones
                if (updateProductDto.recipe.length > 0) {
                    const recipes = updateProductDto.recipe.map((item: any) => manager.create(ProductRecipe, {
                        product_id: id,
                        inventory_item_id: item.inventory_item_id,
                        quantity_required: item.quantity_required,
                    }));
                    await manager.save(recipes);
                }
            } else if (updateProductDto.product_type === ProductType.SIMPLE && updateProductDto.track_inventory) {
                // For simple products, if we don't have a recipe but tracking is on, we might need a default recipe
                // This logic mirrors the 'create' logic but we should be careful about existing inventory items
                // For now, if recipe is missing in payload, we don't change existing ones unless dictated otherwise
            }

            // Sync Variants
            if (updateProductDto.variants) {
                await manager.delete(ProductVariant, { product_id: id });
                if (updateProductDto.variants.length > 0) {
                    const variants = updateProductDto.variants.map((v: any) => manager.create(ProductVariant, {
                        product_id: id,
                        name: v.name,
                        price_modifier: v.price_modifier || 0,
                        cost_modifier: v.cost_modifier || 0,
                        sku: v.sku,
                        barcode: v.barcode,
                    }));
                    await manager.save(variants);
                }
            }

            // Sync Addons
            if (updateProductDto.addons) {
                // Get existing product addons to find related addon entities
                const existingProductAddons = await manager.find(ProductAddon, { where: { product_id: id } });
                const addonIdsToDelete = existingProductAddons.map(pa => pa.addon_id);
                
                // Delete product-addon associations
                await manager.delete(ProductAddon, { product_id: id });
                
                // Delete the actual Addon entities (since they are treated as product-specific in this schema)
                if (addonIdsToDelete.length > 0) {
                    await manager.delete(Addon, addonIdsToDelete);
                }

                // Create new addons
                if (updateProductDto.addons.length > 0) {
                    let displayOrder = 0;
                    for (const addonDto of updateProductDto.addons) {
                        const addon = manager.create(Addon, {
                            store_id: product.store_id,
                            name: addonDto.name,
                            price: addonDto.price || 0,
                            max_quantity: addonDto.max_quantity || 1,
                            required: addonDto.required || false,
                        });
                        const savedAddon = await manager.save(addon);

                        const productAddon = manager.create(ProductAddon, {
                            product_id: id,
                            addon_id: savedAddon.id,
                            display_order: displayOrder++,
                        });
                        await manager.save(productAddon);
                    }
                }
            }

            return this.findOne(userId, id);
        });
    }

    async remove(userId: string, id: string): Promise<void> {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) throw new NotFoundException('Product not found');
        
        try {
            await this.productRepository.remove(product);
        } catch (error: any) {
            if (error.code === '23503') { // Postgres foreign key violation
                throw new ConflictException('Cannot delete product because it is referenced in orders or other records. Consider hiding it instead.');
            }
            throw error;
        }
    }

    private parseJsonFields(dto: any) {
        try {
            if (typeof dto.recipe === 'string') dto.recipe = JSON.parse(dto.recipe);
            if (typeof dto.addons === 'string') dto.addons = JSON.parse(dto.addons);
            if (typeof dto.variants === 'string') dto.variants = JSON.parse(dto.variants);
        } catch (e) {
            // Ignore parse errors, fallback to DTO default
        }
        
        // Convert numeric fields if they are strings
        if (typeof dto.base_price === 'string') dto.base_price = parseFloat(dto.base_price);
        if (typeof dto.cost_price === 'string') dto.cost_price = parseFloat(dto.cost_price);
        if (typeof dto.tax_rate === 'string') dto.tax_rate = parseFloat(dto.tax_rate);
        
        // Convert boolean fields
        if (typeof dto.track_inventory === 'string') dto.track_inventory = dto.track_inventory === 'true';
        if (typeof dto.allow_negative_stock === 'string') dto.allow_negative_stock = dto.allow_negative_stock === 'true';
        if (typeof dto.is_active === 'string') dto.is_active = dto.is_active === 'true';
        if (typeof dto.taxable === 'string') dto.taxable = dto.taxable === 'true';
    }
}
