import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

@Entity('staff')
export class Staff {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column()
    name: string;

    @Column()
    role: string;

    @Column()
    pin_code: string;

    @Column({ default: true })
    is_active: boolean;

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;
}
