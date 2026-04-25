import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

@Entity('product_recipes')
export class ProductRecipe {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    product_id: string;

    @Column({ type: 'uuid' })
    inventory_item_id: string;

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    quantity_required: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    wastage_percent: number;

    @ManyToOne(() => Product, product => product.recipe, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => InventoryItem)
    @JoinColumn({ name: 'inventory_item_id' })
    inventory_item: InventoryItem;
}
