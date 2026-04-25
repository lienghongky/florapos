import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { User } from '../../users/entities/user.entity';
import { ExpenseCategory } from './expense-category.entity';

@Entity('expenses')
export class Expense {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column({ type: 'uuid' })
    category_id: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'uuid', nullable: true })
    recorded_by_user_id: string;

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @ManyToOne(() => ExpenseCategory)
    @JoinColumn({ name: 'category_id' })
    category: ExpenseCategory;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'recorded_by_user_id' })
    recorded_by: User;

    @CreateDateColumn()
    created_at: Date;
}
