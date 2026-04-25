import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Store } from './store.entity';

export enum UserRole {
    OWNER = 'OWNER',
    STAFF = 'STAFF',
}

@Entity('store_users')
export class StoreUser {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.STAFF,
    })
    role: UserRole;

    @ManyToOne(() => User, (user) => user.store_roles)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Store, (store) => store.users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'store_id' })
    store: Store;
}
