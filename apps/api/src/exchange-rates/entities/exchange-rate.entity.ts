import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('exchange_rates')
export class ExchangeRate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 3 })
    from_currency: string;

    @Column({ length: 3 })
    to_currency: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    rate: number;

    @Column({ type: 'timestamp' })
    effective_from: Date;

    @Column({ default: true })
    is_active: boolean;

    @Column({ type: 'uuid', nullable: true })
    created_by: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @CreateDateColumn()
    created_at: Date;
}
