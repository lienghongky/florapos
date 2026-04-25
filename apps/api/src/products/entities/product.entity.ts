import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { Category } from '../../categories/entities/category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductRecipe } from './product-recipe.entity';
import { ProductAddon } from './product-addon.entity';

export enum ProductType {
    SIMPLE = 'simple',
    COMPOSITE = 'composite',
}

export enum PricingType {
    FIXED = 'fixed',
    VARIABLE = 'variable',
}

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    sku: string;

    @Column({ nullable: true })
    barcode: string;

    @Column({ type: 'uuid', nullable: true })
    category_id: string;

    @ManyToOne(() => Category)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column({
        type: 'enum',
        enum: ProductType,
        default: ProductType.SIMPLE,
    })
    product_type: ProductType;

    @Column({
        type: 'enum',
        enum: PricingType,
        default: PricingType.FIXED,
    })
    pricing_type: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    base_price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    cost_price: number;

    @Column({ default: true })
    taxable: boolean;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    tax_rate: number;

    @Column({ default: true })
    track_inventory: boolean;

    @Column({ default: false })
    allow_negative_stock: boolean;

    @Column({ nullable: true })
    image_url: string;

    @Column({ default: true })
    is_active: boolean;

    @OneToMany(() => ProductVariant, (variant) => variant.product)
    variants: ProductVariant[];

    @OneToMany(() => ProductAddon, (addon) => addon.product)
    product_addons: ProductAddon[];

    @OneToMany(() => ProductRecipe, (recipe) => recipe.product)
    recipe: ProductRecipe[];

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
