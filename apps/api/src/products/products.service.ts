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
                    category_id: createProductDto.category_id,
                    tags: createProductDto.tags,
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

    async findAll(userId: string, storeId: string, tags?: string): Promise<Product[]> {
        await this.storesService.findOne(userId, storeId);
        let products = await this.productRepository.find({
            where: { store_id: storeId },
            relations: ['recipe', 'recipe.inventory_item', 'category', 'product_addons', 'product_addons.addon', 'variants']
        });

        // Filter by tags (case-insensitive, ANY match)
        if (tags) {
            const filterTags = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
            if (filterTags.length > 0) {
                products = products.filter(p => {
                    const productTags = (p.tags || []).map(t => t.toLowerCase());
                    return filterTags.some(ft => productTags.includes(ft));
                });
            }
        }

        // Filter inactive variants and addons
        products.forEach(p => {
            if (p.variants) {
                p.variants = p.variants.filter(v => v.is_active);
            }
            if (p.product_addons) {
                p.product_addons = p.product_addons.filter(pa => pa.addon && pa.addon.is_active);
            }
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

        // Filter inactive variants and addons
        if (product.variants) {
            product.variants = product.variants.filter(v => v.is_active);
        }
        if (product.product_addons) {
            product.product_addons = product.product_addons.filter(pa => pa.addon && pa.addon.is_active);
        }

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
            // Build update payload — only include image_url if we have something to set.
            // If no new file was uploaded and no image_url was sent, skip the field
            // entirely so the existing image is not accidentally cleared.
            const imageUrl = image
                ? `/uploads/products/${image.filename}`
                : updateProductDto.image_url || undefined;

            const updatePayload: Partial<Product> = {
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
                is_active: updateProductDto.is_active,
            };

            // Only set image_url when explicitly provided
            if (imageUrl !== undefined) {
                updatePayload.image_url = imageUrl;
            }

            // Only update tags when explicitly provided
            if (updateProductDto.tags !== undefined) {
                updatePayload.tags = updateProductDto.tags;
            }

            await manager.update(Product, id, updatePayload);

            // Keep linked InventoryItem in sync for SIMPLE products
            if (product.product_type === ProductType.SIMPLE) {
                const recipe = await manager.findOne(ProductRecipe, { where: { product_id: id } });
                if (recipe) {
                    await manager.update(InventoryItem, recipe.inventory_item_id, {
                        name: updateProductDto.name,
                        category_id: updateProductDto.category_id,
                        tags: updateProductDto.tags,
                    });
                }
            }


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
                // 1. Mark all existing variants as inactive first
                await manager.update(ProductVariant, { product_id: id }, { is_active: false });

                // 2. Create or Update/Re-activate
                for (const vDto of updateProductDto.variants) {
                    const isUuid = vDto.id && vDto.id.length > 30; // UUID length check
                    
                    if (isUuid) {
                        await manager.update(ProductVariant, vDto.id, {
                            name: vDto.name,
                            price_modifier: Number(vDto.price_modifier || 0),
                            cost_modifier: Number(vDto.cost_modifier || 0),
                            sku: vDto.sku,
                            barcode: vDto.barcode,
                            is_active: true
                        });
                    } else {
                        const variant = manager.create(ProductVariant, {
                            product_id: id,
                            name: vDto.name,
                            price_modifier: Number(vDto.price_modifier || 0),
                            cost_modifier: Number(vDto.cost_modifier || 0),
                            sku: vDto.sku,
                            barcode: vDto.barcode,
                            is_active: true
                        });
                        await manager.save(variant);
                    }
                }
            }

            // Sync Addons
            if (updateProductDto.addons) {
                const existingProductAddons = await manager.find(ProductAddon, { 
                    where: { product_id: id },
                    relations: ['addon']
                });
                
                // 1. Deactivate old ones
                const existingAddonIds = existingProductAddons.map(pa => pa.addon_id);
                if (existingAddonIds.length > 0) {
                    await manager.update(Addon, existingAddonIds, { is_active: false });
                }

                // 2. Remove mapping
                await manager.delete(ProductAddon, { product_id: id });
                
                // 3. Re-link/Update/Create
                let displayOrder = 0;
                for (const addonDto of updateProductDto.addons) {
                    const isUuid = addonDto.id && addonDto.id.length > 30;
                    let addonId = isUuid ? addonDto.id : null;

                    if (!addonId) { 
                        const addon = manager.create(Addon, {
                            store_id: product.store_id,
                            name: addonDto.name,
                            price: addonDto.price || 0,
                            max_quantity: addonDto.max_quantity || 1,
                            required: addonDto.required || false,
                            is_active: true
                        });
                        const savedAddon = await manager.save(addon);
                        addonId = savedAddon.id;
                    } else {
                        await manager.update(Addon, addonId, {
                            name: addonDto.name,
                            price: addonDto.price || 0,
                            max_quantity: addonDto.max_quantity || 1,
                            required: addonDto.required || false,
                            is_active: true
                        });
                    }

                    const productAddon = manager.create(ProductAddon, {
                        product_id: id,
                        addon_id: addonId,
                        display_order: displayOrder++,
                    });
                    await manager.save(productAddon);
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
            if (typeof dto.tags === 'string') dto.tags = JSON.parse(dto.tags);
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
