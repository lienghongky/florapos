import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { Product } from './product.entity';
import { ModifierOption } from './modifier-option.entity';

export enum SelectionType {
    SINGLE = 'single',
    MULTIPLE = 'multiple',
}

@Entity('modifier_groups')
export class ModifierGroup {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column({ type: 'uuid' })
    product_id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: SelectionType,
        default: SelectionType.SINGLE,
    })
    selection_type: SelectionType;

    @Column({ default: 0 })
    min_selection: number;

    @Column({ default: 1 })
    max_selection: number;

    @Column({ default: true })
    is_active: boolean;

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @ManyToOne(() => Product, (product) => product.modifier_groups, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @OneToMany(() => ModifierOption, (option) => option.group, { cascade: true })
    options: ModifierOption[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
