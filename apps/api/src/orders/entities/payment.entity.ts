import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded'
}

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    order_id: string;

    @Column()
    method: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    tip_amount: number;

    @Column({ nullable: true })
    transaction_ref: string;

    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.COMPLETED })
    status: PaymentStatus;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ type: 'timestamp', nullable: true })
    paid_at: Date;

    @CreateDateColumn()
    created_at: Date;
}
