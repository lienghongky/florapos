import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

export enum SubscriptionStatus {
    TRIALING = 'trialing',
    ACTIVE = 'active',
    PAST_DUE = 'past_due',
    CANCELED = 'canceled',
    EXPIRED = 'expired',
}

@Entity('subscriptions')
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'uuid' })
    plan_id: string;

    @Column({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.ACTIVE,
    })
    status: SubscriptionStatus;

    @Column({ type: 'timestamp', nullable: true })
    trial_start_at: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    trial_end_at: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    current_period_start: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    current_period_end: Date | null;

    @Column({ default: false })
    cancel_at_period_end: boolean;

    @Column({ default: true })
    is_auto_renew: boolean;

    @Column({ nullable: true })
    external_customer_id: string;

    @Column({ nullable: true })
    external_subscription_id: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => SubscriptionPlan)
    @JoinColumn({ name: 'plan_id' })
    plan: SubscriptionPlan;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
