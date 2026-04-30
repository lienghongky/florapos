import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('telegram_link_tokens')
export class TelegramLinkToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'varchar', unique: true })
    token: string;

    @Column({ type: 'timestamp' })
    expires_at: Date;

    @Column({ default: false })
    used: boolean;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    created_at: Date;
}
