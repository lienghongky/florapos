import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { Addon } from './addon.entity';

@Entity('product_addons')
export class ProductAddon {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    product_id: string;

    @Column({ type: 'uuid' })
    addon_id: string;

    @Column({ type: 'int', default: 0 })
    display_order: number;

    @ManyToOne(() => Product, (product) => product.product_addons, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => Addon, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'addon_id' })
    addon: Addon;
}
