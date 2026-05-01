import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string; // Starter, Pro, Elite

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ default: 1 })
    max_stores: number;

    @Column({ default: 1 })
    max_users: number;

    @Column('jsonb', { default: [] })
    features: string[]; // e.g. ["telegram_notifications", "advanced_reports"]

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
