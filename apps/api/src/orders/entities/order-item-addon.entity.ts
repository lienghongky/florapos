import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Addon } from '../../products/entities/addon.entity';

@Entity('order_item_addons')
export class OrderItemAddon {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    order_item_id: string;

    @Column({ type: 'uuid', nullable: true })
    addon_id: string;

    @Column()
    name_snapshot: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ type: 'integer', default: 1 })
    quantity: number;

    @ManyToOne(() => OrderItem, item => item.addons, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_item_id' })
    orderItem: OrderItem;

    @ManyToOne(() => Addon, { nullable: true })
    @JoinColumn({ name: 'addon_id' })
    addon: Addon;
}
