import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

@Entity('emenu_settings')
export class EmenuSetting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unique: true })
    store_id: string;

    @OneToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @Column({ default: false })
    is_enabled: boolean;

    @Column({ default: true })
    show_prices: boolean;

    @Column({ default: false })
    allow_ordering: boolean;

    @Column({ nullable: true })
    banner_image: string;
    
    @Column({ nullable: true })
    theme_color: string;

    @Column({ default: 'default' })
    template_id: string;

    @Column({ default: false })
    require_customer_name: boolean;

    @Column({ default: false })
    require_customer_phone: boolean;

    @Column({ type: 'jsonb', default: [] })
    qr_tags: string[];

    @Column({ type: 'jsonb', nullable: true })
    social_links: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        tiktok?: string;
        telegram?: string;
        website?: string;
    };

    @Column({ type: 'jsonb', default: [] })
    phone_numbers: string[];


    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
