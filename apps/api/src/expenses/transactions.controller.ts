import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TransactionType } from './entities/transaction.entity';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

/**
 * Controller for managing financial transactions (expenses and incomes).
 * Provides auditing, summary statistics, and Profit & Loss reports.
 */
@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner')
@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    @ApiOperation({ summary: 'Create expense/income transaction' })
    create(@Request() req: any, @Body() createDto: CreateTransactionDto) {
        return this.transactionsService.create(req.user.userId, createDto);
    }

    @Get()
    @ApiOperation({ summary: 'List transactions with filters' })
    findAll(
        @Request() req: any,
        @Query('storeId') storeId: string,
        @Query('type') type?: TransactionType,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('categoryId') categoryId?: string,
        @Query('search') search?: string,
    ) {
        return this.transactionsService.findAll(req.user.userId, storeId, type, startDate, endDate, categoryId, search);
    }

    @Get('summary')
    @ApiOperation({ summary: 'Get transaction summary' })
    @ApiResponse({ status: 200, description: 'Returns summary statistics' })
    getSummary(
        @Request() req: any,
        @Query('storeId') storeId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.transactionsService.getSummary(req.user.userId, storeId, startDate, endDate);
    }

    @Get('pl-report')
    @ApiOperation({ summary: 'Get Profit & Loss report' })
    @ApiResponse({ status: 200, description: 'Returns P&L report' })
    getPLReport(
        @Request() req: any,
        @Query('storeId') storeId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.transactionsService.getPLReport(req.user.userId, storeId, startDate, endDate);
    }

    @Get('export')
    @ApiOperation({ summary: 'Export transactions as JSON/CSV' })
    @ApiResponse({ status: 200, description: 'Returns transaction data for export' })
    exportData(
        @Request() req: any,
        @Query('storeId') storeId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.transactionsService.exportData(req.user.userId, storeId, startDate, endDate);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get transaction by ID' })
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.transactionsService.findOne(req.user.userId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update transaction' })
    update(@Request() req: any, @Param('id') id: string, @Body() updateDto: UpdateTransactionDto) {
        return this.transactionsService.update(req.user.userId, id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete transaction' })
    remove(@Request() req: any, @Param('id') id: string) {
        return this.transactionsService.remove(req.user.userId, id);
    }
}
