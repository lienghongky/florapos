import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

@Entity('units')
export class Unit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column()
    name: string; // e.g. 'Kilogram', 'Box'

    @Column({ length: 10 })
    short_code: string; // e.g. 'kg', 'box'

    @Column({ default: false })
    is_base: boolean; // If true, this is a base unit for dimension

    @Column({ type: 'decimal', precision: 10, scale: 4, default: 1 })
    conversion_factor: number; // Multiplier to base unit

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @CreateDateColumn()
    created_at: Date;
}
