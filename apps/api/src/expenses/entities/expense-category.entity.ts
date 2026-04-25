import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

export enum CategoryType {
    EXPENSE = 'expense',
    INCOME = 'income',
}

@Entity('expense_categories')
export class ExpenseCategory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: CategoryType,
    })
    type: CategoryType;

    @Column({ nullable: true, length: 7 })
    color: string; // Hex color

    @Column({ nullable: true, length: 50 })
    icon: string;

    @Column({ default: false })
    is_system: boolean; // System categories can't be deleted

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
