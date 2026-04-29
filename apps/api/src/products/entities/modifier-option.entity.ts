import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ModifierGroup } from './modifier-group.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

@Entity('modifier_options')
export class ModifierOption {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    group_id: string;

    @Column()
    name: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price_adjustment: number;

    @Column({ type: 'uuid', nullable: true })
    inventory_item_id: string;

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    quantity_needed: number;

    @Column({ default: true })
    is_active: boolean;

    @ManyToOne(() => ModifierGroup, (group) => group.options, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'group_id' })
    group: ModifierGroup;

    @ManyToOne(() => InventoryItem, { nullable: true })
    @JoinColumn({ name: 'inventory_item_id' })
    inventory_item: InventoryItem;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
