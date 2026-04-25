import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, UpdatePaymentStatusDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { OrderStatus } from './entities/order.entity';

/**
 * Controller for managing sales orders and transactions.
 * Handles checkout, status updates, and sales analytics.
 */
@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @ApiOperation({ summary: 'Create order (checkout)' })
    @ApiResponse({ status: 201, description: 'Order created successfully' })
    create(@Request() req: any, @Body() createDto: CreateOrderDto) {
        return this.ordersService.create(req.user.userId, createDto);
    }

    @Get()
    @ApiOperation({ summary: 'List orders with filters' })
    findAll(
        @Request() req: any,
        @Query('storeId') storeId: string,
        @Query('status') status?: OrderStatus,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.ordersService.findAll(req.user.userId, storeId, status, startDate, endDate, search, page, limit);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get sales statistics' })
    @ApiResponse({ status: 200, description: 'Returns sales stats' })
    getStats(
        @Request() req: any,
        @Query('storeId') storeId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.ordersService.getStats(req.user.userId, storeId, startDate, endDate);
    }

    @Get('recent')
    @ApiOperation({ summary: 'Get recent orders' })
    @ApiResponse({ status: 200, description: 'Returns recent orders' })
    getRecent(
        @Request() req: any,
        @Query('storeId') storeId: string,
        @Query('limit') limit?: number,
    ) {
        return this.ordersService.getRecent(req.user.userId, storeId, limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get order by ID' })
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.ordersService.findOne(req.user.userId, id);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update order status' })
    updateStatus(@Request() req: any, @Param('id') id: string, @Body() updateDto: UpdateOrderStatusDto) {
        return this.ordersService.updateStatus(req.user.userId, id, updateDto);
    }

    @Patch(':id/payment')
    @ApiOperation({ summary: 'Update payment status' })
    updatePaymentStatus(@Request() req: any, @Param('id') id: string, @Body() updateDto: UpdatePaymentStatusDto) {
        return this.ordersService.updatePaymentStatus(req.user.userId, id, updateDto);
    }
}
