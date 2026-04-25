import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { StoreUser } from '../../stores/entities/store-user.entity';
import { UserRole } from '../dto/create-user.dto';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false }) // Don't return password by default
    password_hash: string;

    @Column({ nullable: true })
    full_name: string;
    
    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.STAFF,
    })
    role: UserRole;

    @Column({ default: false })
    is_active: boolean;

    @Column({ type: 'varchar', nullable: true })
    activation_token: string | null;

    @OneToMany(() => StoreUser, (storeUser) => storeUser.user)
    store_roles: StoreUser[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
