import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoryType } from './entities/expense-category.entity';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

/**
 * Controller for managing expense and income categories.
 * Allows owners to categorize their financial transactions.
 */
@ApiTags('expense-categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner')
@Controller('expense-categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @ApiOperation({ summary: 'Create expense/income category' })
    create(@Request() req: any, @Query('storeId') storeId: string, @Body() createDto: CreateCategoryDto) {
        return this.categoriesService.create(req.user.userId, storeId, createDto);
    }

    @Get()
    @ApiOperation({ summary: 'List categories' })
    findAll(@Request() req: any, @Query('storeId') storeId: string, @Query('type') type?: CategoryType) {
        return this.categoriesService.findAll(req.user.userId, storeId, type);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update category' })
    update(@Request() req: any, @Param('id') id: string, @Body() updateDto: UpdateCategoryDto) {
        return this.categoriesService.update(req.user.userId, id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete category' })
    remove(@Request() req: any, @Param('id') id: string) {
        return this.categoriesService.remove(req.user.userId, id);
    }

    @Post('seed')
    @ApiOperation({ summary: 'Seed default categories for a store' })
    seedDefaults(@Query('storeId') storeId: string) {
        return this.categoriesService.seedDefaultCategories(storeId);
    }
}
