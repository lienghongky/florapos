import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Staff } from '../../users/entities/staff.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('pos_sessions')
export class PosSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column({ type: 'uuid' })
    staff_id: string;

    @Column({ type: 'timestamp', nullable: true })
    opened_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    closed_at: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    opening_cash: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    closing_cash: number;

    @Column({ default: 'open' })
    status: string;

    @ManyToOne(() => Staff)
    @JoinColumn({ name: 'staff_id' })
    staff: Staff;

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;
}
