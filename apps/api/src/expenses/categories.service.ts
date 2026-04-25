import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseCategory, CategoryType } from './entities/expense-category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { StoresService } from '../stores/stores.service';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(ExpenseCategory)
        private categoryRepository: Repository<ExpenseCategory>,
        private storesService: StoresService,
    ) { }

    async create(userId: string, storeId: string, createDto: CreateCategoryDto): Promise<ExpenseCategory> {
        await this.storesService.findOne(userId, storeId);

        const category = this.categoryRepository.create({
            ...createDto,
            store_id: storeId,
        });

        return this.categoryRepository.save(category);
    }

    async findAll(userId: string, storeId: string, type?: CategoryType): Promise<ExpenseCategory[]> {
        await this.storesService.findOne(userId, storeId);

        const where: any = { store_id: storeId };
        if (type) {
            where.type = type;
        }

        return this.categoryRepository.find({
            where,
            order: { name: 'ASC' },
        });
    }

    async update(userId: string, id: string, updateDto: UpdateCategoryDto): Promise<ExpenseCategory> {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) throw new NotFoundException('Category not found');

        await this.storesService.findOne(userId, category.store_id);

        if (category.is_system) {
            throw new BadRequestException('System categories cannot be modified');
        }

        Object.assign(category, updateDto);
        return this.categoryRepository.save(category);
    }

    async remove(userId: string, id: string): Promise<void> {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) throw new NotFoundException('Category not found');

        await this.storesService.findOne(userId, category.store_id);

        if (category.is_system) {
            throw new BadRequestException('System categories cannot be deleted');
        }

        await this.categoryRepository.remove(category);
    }

    async seedDefaultCategories(storeId: string): Promise<void> {
        const expenseCategories = [
            { name: 'Rent & Utilities', color: '#FF6B6B', icon: 'home' },
            { name: 'Salaries & Wages', color: '#4ECDC4', icon: 'users' },
            { name: 'Inventory Purchases', color: '#45B7D1', icon: 'package' },
            { name: 'Marketing & Advertising', color: '#FFA07A', icon: 'megaphone' },
            { name: 'Equipment & Supplies', color: '#98D8C8', icon: 'tool' },
            { name: 'Maintenance & Repairs', color: '#F7DC6F', icon: 'wrench' },
            { name: 'Taxes & Fees', color: '#BB8FCE', icon: 'file-text' },
            { name: 'Other Expenses', color: '#95A5A6', icon: 'more-horizontal' },
        ];

        const incomeCategories = [
            { name: 'Sales Revenue', color: '#2ECC71', icon: 'dollar-sign' },
            { name: 'Service Income', color: '#3498DB', icon: 'briefcase' },
            { name: 'Other Income', color: '#1ABC9C', icon: 'trending-up' },
        ];

        for (const cat of expenseCategories) {
            await this.categoryRepository.save({
                ...cat,
                store_id: storeId,
                type: CategoryType.EXPENSE,
                is_system: true,
            });
        }

        for (const cat of incomeCategories) {
            await this.categoryRepository.save({
                ...cat,
                store_id: storeId,
                type: CategoryType.INCOME,
                is_system: true,
            });
        }
    }
}
