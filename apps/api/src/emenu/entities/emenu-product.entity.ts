import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('emenu_products')
@Unique(['store_id', 'product_id'])
export class EmenuProduct {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column({ type: 'uuid' })
    product_id: string;

    @CreateDateColumn()
    created_at: Date;
}
