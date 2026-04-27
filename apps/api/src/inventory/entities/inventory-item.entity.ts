import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { Unit } from '../../settings/entities/unit.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('inventory_items')
export class InventoryItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    sku: string;

    @Column({ nullable: true })
    barcode: string;

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    current_stock: number; // maps to stockQty

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    reserved_qty: number;

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    min_stock_threshold: number; // maps to reorderLevel

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    reorder_qty: number;

    @Column({ type: 'uuid', nullable: true })
    unit_id: string;

    @ManyToOne(() => Unit)
    @JoinColumn({ name: 'unit_id' })
    unit: Unit;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    cost_price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    average_cost: number;

    @Column({ nullable: true })
    supplier: string;

    @Column({ nullable: true })
    location: string;

    @Column({ default: true })
    is_active: boolean;

    @Column({ type: 'uuid', nullable: true })
    category_id: string;

    @ManyToOne(() => Category)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column({ type: 'simple-array', nullable: true, default: null })
    tags: string[];

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
