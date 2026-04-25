import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Discount } from './discount.entity';

@Entity('applied_discounts')
export class AppliedDiscount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    order_id: string;

    @Column({ type: 'uuid', nullable: true })
    order_item_id: string;

    @Column({ type: 'uuid', nullable: true })
    discount_id: string;

    @Column()
    name_snapshot: string;

    @Column()
    discount_type: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    value_snapshot: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    applied_amount: number;

    @Column({ type: 'uuid', nullable: true })
    applied_by_staff_id: string;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => OrderItem, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_item_id' })
    orderItem: OrderItem;

    @ManyToOne(() => Discount, { nullable: true })
    @JoinColumn({ name: 'discount_id' })
    discount: Discount;

    @CreateDateColumn()
    created_at: Date;
}
