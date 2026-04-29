import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { StoreUser } from './store-user.entity';

@Entity('stores')
export class Store {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ default: 'USD' })
    currency: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phone_number: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({ nullable: true })
    banner_image: string;

    @Column({ nullable: true })
    logo_url: string;

    @Column({ nullable: true })
    tax_id: string;

    @Column('text', { nullable: true })
    receipt_footer_text: string;

    @Column({ nullable: true })
    website: string;

    @Column({ nullable: true })
    invoice_prefix: string;
    
    @Column('decimal', { precision: 5, scale: 2, default: 0, transformer: {
        to: (value: number) => value,
        from: (value: string) => parseFloat(value)
    } })
    tax_rate: number;

    @Column('decimal', { precision: 12, scale: 4, default: 1.0, transformer: {
        to: (value: number) => value,
        from: (value: string) => parseFloat(value)
    } })
    exchange_rate: number;

    @OneToMany(() => StoreUser, (storeUser) => storeUser.store)
    users: StoreUser[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
