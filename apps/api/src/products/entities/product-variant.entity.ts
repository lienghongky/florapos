import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    product_id: string;

    @Column()
    name: string; // 'Small', 'Medium', 'Large'

    @Column({ nullable: true })
    sku: string;

    @Column({ nullable: true })
    barcode: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price_modifier: number; // +$0.50

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    cost_modifier: number;

    @Column({ default: false })
    is_default: boolean;

    @Column({ default: true })
    is_active: boolean;

    @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
