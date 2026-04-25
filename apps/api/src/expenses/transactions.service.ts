import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { StoresService } from '../stores/stores.service';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
        private storesService: StoresService,
    ) { }

    async create(userId: string, createDto: CreateTransactionDto): Promise<Transaction> {
        await this.storesService.findOne(userId, createDto.store_id);

        const transaction = this.transactionRepository.create({
            ...createDto,
            created_by: userId,
        });

        return this.transactionRepository.save(transaction);
    }

    async findAll(
        userId: string,
        storeId: string,
        type?: TransactionType,
        startDate?: string,
        endDate?: string,
        categoryId?: string,
        search?: string,
    ): Promise<Transaction[]> {
        await this.storesService.findOne(userId, storeId);

        const queryBuilder = this.transactionRepository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.category', 'category')
            .leftJoinAndSelect('transaction.creator', 'creator')
            .where('transaction.store_id = :storeId', { storeId })
            .orderBy('transaction.transaction_date', 'DESC')
            .addOrderBy('transaction.created_at', 'DESC');

        if (type) {
            queryBuilder.andWhere('transaction.type = :type', { type });
        }

        if (startDate && endDate) {
            queryBuilder.andWhere('transaction.transaction_date BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        } else if (startDate) {
            queryBuilder.andWhere('transaction.transaction_date >= :startDate', { startDate });
        } else if (endDate) {
            queryBuilder.andWhere('transaction.transaction_date <= :endDate', { endDate });
        }

        if (categoryId) {
            queryBuilder.andWhere('transaction.category_id = :categoryId', { categoryId });
        }

        if (search) {
            queryBuilder.andWhere(
                '(transaction.description LIKE :search OR transaction.reference_number LIKE :search OR transaction.notes LIKE :search)',
                { search: `%${search}%` }
            );
        }

        return queryBuilder.getMany();
    }

    async findOne(userId: string, id: string): Promise<Transaction> {
        const transaction = await this.transactionRepository.findOne({
            where: { id },
            relations: ['category', 'creator'],
        });

        if (!transaction) throw new NotFoundException('Transaction not found');
        await this.storesService.findOne(userId, transaction.store_id);

        return transaction;
    }

    async update(userId: string, id: string, updateDto: UpdateTransactionDto): Promise<Transaction> {
        const transaction = await this.findOne(userId, id);
        Object.assign(transaction, updateDto);
        return this.transactionRepository.save(transaction);
    }

    async remove(userId: string, id: string): Promise<void> {
        const transaction = await this.findOne(userId, id);
        await this.transactionRepository.remove(transaction);
    }

    async getSummary(userId: string, storeId: string, startDate?: string, endDate?: string): Promise<any> {
        await this.storesService.findOne(userId, storeId);

        const queryBuilder = this.transactionRepository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.category', 'category')
            .where('transaction.store_id = :storeId', { storeId });

        if (startDate && endDate) {
            queryBuilder.andWhere('transaction.transaction_date BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }

        const transactions = await queryBuilder.getMany();

        const totalIncome = transactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalExpenses = transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const netProfit = totalIncome - totalExpenses;

        // Group by category
        const byCategory: Record<string, { amount: number; type: TransactionType }> = transactions.reduce((acc, t) => {
            const catName = t.category?.name || 'Uncategorized';
            if (!acc[catName]) {
                acc[catName] = { amount: 0, type: t.type };
            }
            acc[catName].amount += Number(t.amount);
            return acc;
        }, {} as Record<string, { amount: number; type: TransactionType }>);

        return {
            total_income: totalIncome,
            total_expenses: totalExpenses,
            net_profit: netProfit,
            by_category: byCategory,
            transaction_count: transactions.length,
        };
    }

    async getPLReport(userId: string, storeId: string, startDate?: string, endDate?: string): Promise<any> {
        const summary = await this.getSummary(userId, storeId, startDate, endDate);
        const transactions = await this.findAll(userId, storeId, undefined, startDate, endDate);

        const income: Record<string, number> = transactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((acc, t) => {
                const catName = t.category?.name || 'Uncategorized';
                if (!acc[catName]) acc[catName] = 0;
                acc[catName] += Number(t.amount);
                return acc;
            }, {} as Record<string, number>);

        const expenses: Record<string, number> = transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => {
                const catName = t.category?.name || 'Uncategorized';
                if (!acc[catName]) acc[catName] = 0;
                acc[catName] += Number(t.amount);
                return acc;
            }, {} as Record<string, number>);

        return {
            period: { start_date: startDate, end_date: endDate },
            income: {
                categories: income,
                total: summary.total_income,
            },
            expenses: {
                categories: expenses,
                total: summary.total_expenses,
            },
            net_profit: summary.net_profit,
        };
    }

    async exportData(userId: string, storeId: string, startDate?: string, endDate?: string): Promise<any[]> {
        const transactions = await this.findAll(userId, storeId, undefined, startDate, endDate);

        return transactions.map(t => ({
            date: t.transaction_date,
            type: t.type,
            category: t.category?.name || 'Uncategorized',
            description: t.description,
            amount: Number(t.amount),
            payment_method: t.payment_method,
            reference_number: t.reference_number,
            notes: t.notes,
        }));
    }
}
