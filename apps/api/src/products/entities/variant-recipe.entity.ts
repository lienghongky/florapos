import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

@Entity('variant_recipes')
export class VariantRecipe {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    variant_id: string;

    @Column({ type: 'uuid' })
    inventory_item_id: string;

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    quantity_required: number;

    @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'variant_id' })
    variant: ProductVariant;

    @ManyToOne(() => InventoryItem)
    @JoinColumn({ name: 'inventory_item_id' })
    inventory_item: InventoryItem;
}
