import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { OrderItemAddon } from './order-item-addon.entity';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    order_id: string;

    @Column({ type: 'uuid', nullable: true })
    product_id: string;

    @Column({ type: 'uuid', nullable: true })
    variant_id: string;

    @Column()
    product_name_snapshot: string; 

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    unit_price: number;

    @Column({ type: 'integer', default: 1 })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    tax_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    line_total: number;

    @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => Product, { nullable: true })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => ProductVariant, { nullable: true })
    @JoinColumn({ name: 'variant_id' })
    variant: ProductVariant;

    @OneToMany(() => OrderItemAddon, addon => addon.orderItem, { cascade: true })
    addons: OrderItemAddon[];

    @CreateDateColumn()
    created_at: Date;
}
