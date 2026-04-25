import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('saas_payments')
export class SaaSPayment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    owner_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'varchar', length: 3, default: 'USD' })
    currency: string;

    @Column({ type: 'date' })
    payment_date: Date;

    @Column({ type: 'date' })
    coverage_start_date: Date;

    @Column({ type: 'date' })
    coverage_end_date: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    created_at: Date;
}
