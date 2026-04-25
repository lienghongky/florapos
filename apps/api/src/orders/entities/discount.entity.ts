import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

@Entity('discounts')
export class Discount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    discount_type: string; // 'percentage' | 'fixed_amount'

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    value: number;

    @Column({ default: 'order' })
    scope: string; // 'order' | 'item'

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    max_discount_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    min_order_amount: number;

    @Column({ type: 'timestamp', nullable: true })
    start_date: Date;

    @Column({ type: 'timestamp', nullable: true })
    end_date: Date;

    @Column({ nullable: true })
    coupon_code: string;

    @Column({ default: false })
    auto_apply: boolean;

    @Column({ default: false })
    stackable: boolean;

    @Column({ type: 'int', nullable: true })
    usage_limit: number;

    @Column({ type: 'int', default: 0 })
    used_count: number;

    @Column({ default: true })
    is_active: boolean;

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
