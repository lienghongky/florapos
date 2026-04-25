import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InventoryItem } from './inventory-item.entity';
import { Store } from '../../stores/entities/store.entity';
import { User } from '../../users/entities/user.entity';

export enum InventoryActionType {
    SALE = 'SALE',
    STOCK_IN = 'STOCK_IN',
    RESTOCK = 'RESTOCK',
    ADJUSTMENT = 'ADJUSTMENT',
    DAMAGE = 'DAMAGE',
    EXPIRED = 'EXPIRED',
    COMPOSITE_DEDUCTION = 'COMPOSITE_DEDUCTION',
}

@Entity('inventory_history')
export class InventoryHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column({ type: 'uuid' })
    inventory_item_id: string;

    @Column({
        type: 'enum',
        enum: InventoryActionType,
    })
    action_type: InventoryActionType;

    @Column({ type: 'decimal', precision: 10, scale: 3 })
    quantity_change: number;

    @Column({ type: 'decimal', precision: 10, scale: 3 })
    quantity_before: number;

    @Column({ type: 'decimal', precision: 10, scale: 3 })
    quantity_after: number;

    @Column({ type: 'uuid', nullable: true })
    reference_id: string | null; // ID of the Sale or Adjustment

    @Column({ type: 'varchar', nullable: true })
    reference_type: string | null; // 'sale', 'adjustment'

    @Column({ type: 'uuid', nullable: true })
    performed_by_user_id: string;

    @Column({ type: 'text', nullable: true })
    notes: string | null; // Reason or note for the action

    @ManyToOne(() => InventoryItem)
    @JoinColumn({ name: 'inventory_item_id' })
    item: InventoryItem;

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'performed_by_user_id' })
    user: User;

    @CreateDateColumn()
    timestamp: Date;
}
