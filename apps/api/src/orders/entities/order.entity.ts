import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../users/entities/customer.entity';
import { PosSession } from './pos-session.entity';
import { OrderItem } from './order-item.entity';

export enum OrderType {
    PICKUP = 'pickup',
    DELIVERY = 'delivery',
}

export enum OrderStatus {
    PENDING = 'pending',
    PREPARING = 'preparing',
    READY = 'ready',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column({ unique: true, length: 50 })
    order_number: string;

    @Column({
        type: 'enum',
        enum: OrderType,
    })
    order_type: OrderType;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Column({ type: 'uuid', nullable: true })
    customer_id: string;

    @Column({ type: 'uuid', nullable: true })
    staff_id: string;

    @Column({ type: 'uuid', nullable: true })
    session_id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount_total: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    tax_total: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    grand_total: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    delivery_fee: number;

    @Column({ type: 'text', nullable: true })
    delivery_address: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @ManyToOne(() => Customer, { nullable: true })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'staff_id' })
    staff: User;

    @ManyToOne(() => PosSession, { nullable: true })
    @JoinColumn({ name: 'session_id' })
    session: PosSession;

    @OneToMany(() => OrderItem, item => item.order, { cascade: true })
    items: OrderItem[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    closed_at: Date;

    @Column({ nullable: true })
    payment_method: string;

    @Column({ nullable: true })
    staff_name: string;

    @Column({ nullable: true })
    customer_name: string;

    @Column({ nullable: true })
    customer_phone: string;

    @Column('decimal', { precision: 12, scale: 4, default: 1.0, transformer: {
        to: (value: number) => value,
        from: (value: string) => parseFloat(value)
    } })
    exchange_rate: number;

    @Column('decimal', { precision: 5, scale: 2, default: 0, transformer: {
        to: (value: number) => value,
        from: (value: string) => parseFloat(value)
    } })
    tax_rate: number;
}
