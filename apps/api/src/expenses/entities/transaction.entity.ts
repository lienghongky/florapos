import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { User } from '../../users/entities/user.entity';
import { ExpenseCategory } from './expense-category.entity';

export enum TransactionType {
    EXPENSE = 'expense',
    INCOME = 'income',
}

export enum PaymentMethod {
    CASH = 'cash',
    CARD = 'card',
    BANK_TRANSFER = 'bank_transfer',
    MOBILE_PAYMENT = 'mobile_payment',
    OTHER = 'other',
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    store_id: string;

    @Column({ type: 'uuid' })
    category_id: string;

    @Column({
        type: 'enum',
        enum: TransactionType,
    })
    type: TransactionType;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'date' })
    transaction_date: Date;

    @Column({ nullable: true, length: 100 })
    reference_number: string;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
        nullable: true,
    })
    payment_method: PaymentMethod;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'uuid', nullable: true })
    created_by: string;

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @ManyToOne(() => ExpenseCategory)
    @JoinColumn({ name: 'category_id' })
    category: ExpenseCategory;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
