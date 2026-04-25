import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { ExpenseCategory } from './entities/expense-category.entity';
import { Transaction } from './entities/transaction.entity';
import { StoresModule } from '../stores/stores.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ExpenseCategory, Transaction]),
        StoresModule,
    ],
    controllers: [CategoriesController, TransactionsController],
    providers: [CategoriesService, TransactionsService],
    exports: [CategoriesService, TransactionsService],
})
export class ExpensesModule { }
