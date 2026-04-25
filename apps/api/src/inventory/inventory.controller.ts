import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Controller for managing inventory items and stock levels.
 * Tracks stock history and supports manual adjustments.
 */
@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new inventory item' })
    @ApiResponse({ status: 201, description: 'Inventory item created successfully' })
    create(@Request() req: any, @Body() createDto: CreateInventoryItemDto) {
        return this.inventoryService.create(req.user.userId, createDto);
    }

    @Get()
    @ApiOperation({ summary: 'List inventory items for a store' })
    findAll(@Request() req: any, @Query('storeId') storeId: string) {
        return this.inventoryService.findAll(req.user.userId, storeId);
    }

    @Get('find')
    @ApiOperation({ summary: 'Find inventory item by barcode, SKU, or name' })
    findByCode(
        @Request() req: any, 
        @Query('storeId') storeId: string, 
        @Query('code') code: string
    ) {
        return this.inventoryService.findByCode(req.user.userId, storeId, code);
    }

    @Get('summary')
    @ApiOperation({ summary: 'Get inventory summary/statistics' })
    @ApiResponse({ status: 200, description: 'Returns inventory statistics' })
    getSummary(@Request() req: any, @Query('storeId') storeId: string) {
        return this.inventoryService.getSummary(req.user.userId, storeId);
    }

    @Patch(':id/adjust')
    @ApiOperation({ summary: 'Adjust inventory stock' })
    @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
    adjustStock(@Request() req: any, @Param('id') id: string, @Body() updateDto: UpdateStockDto) {
        return this.inventoryService.adjustStock(req.user.userId, id, updateDto);
    }

    @Get(':id/history')
    @ApiOperation({ summary: 'Get inventory history with filters' })
    getHistory(
        @Request() req: any,
        @Param('id') id: string,
        @Query('action_type') actionType?: string,
        @Query('search') search?: string,
    ) {
        return this.inventoryService.getHistory(req.user.userId, id, actionType, search);
    }

    @Get('history')
    @ApiOperation({ summary: 'Get global inventory history for a store' })
    getGlobalHistory(
        @Request() req: any,
        @Query('storeId') storeId: string,
        @Query('action_type') actionType?: string,
        @Query('search') search?: string,
        @Query('start_date') startDate?: string,
        @Query('end_date') endDate?: string,
    ) {
        return this.inventoryService.getGlobalHistory(req.user.userId, storeId, actionType, search, startDate, endDate);
    }

    @Get('export')
    @ApiOperation({ summary: 'Export inventory as JSON/CSV' })
    @ApiResponse({ status: 200, description: 'Returns inventory data for export' })
    exportInventory(@Request() req: any, @Query('storeId') storeId: string) {
        return this.inventoryService.exportInventory(req.user.userId, storeId);
    }

    @Post('import')
    @ApiOperation({ summary: 'Import inventory from JSON/CSV' })
    @ApiResponse({ status: 201, description: 'Inventory imported successfully' })
    importInventory(
        @Request() req: any,
        @Query('storeId') storeId: string,
        @Body() items: any[],
    ) {
        return this.inventoryService.importInventory(req.user.userId, storeId, items);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an inventory item' })
    @ApiResponse({ status: 200, description: 'Item deleted successfully' })
    async remove(@Request() req: any, @Param('id') id: string) {
        await this.inventoryService.remove(req.user.userId, id);
        return { success: true };
    }
}
