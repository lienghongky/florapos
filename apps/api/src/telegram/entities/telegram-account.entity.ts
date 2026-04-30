import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('telegram_accounts')
@Unique(['chat_id'])
export class TelegramAccount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'bigint' })
    chat_id: number;

    @Column({ type: 'varchar', nullable: true })
    username: string | null;

    @Column({ default: true })
    is_active: boolean;

    @Column({ type: 'uuid', nullable: true })
    active_store_id: string | null;

    // ── Notification Preferences ─────────────────────────────────────────
    @Column({ default: true })
    notify_orders: boolean;

    @Column({ default: true })
    notify_daily_summary: boolean;

    @Column({ default: true })
    notify_low_stock: boolean;

    // ── Relations ────────────────────────────────────────────────────────
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Store, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'active_store_id' })
    active_store: Store;

    @CreateDateColumn()
    created_at: Date;
}
