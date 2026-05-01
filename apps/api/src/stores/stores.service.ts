import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { StoreUser, UserRole } from './entities/store-user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { User } from '../users/entities/user.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class StoresService {
    constructor(
        @InjectRepository(Store)
        private storesRepository: Repository<Store>,
        @InjectRepository(StoreUser)
        private storeUsersRepository: Repository<StoreUser>,
        private subscriptionsService: SubscriptionsService,
    ) { }

    async create(userId: string, createStoreDto: CreateStoreDto): Promise<Store> {
        // Check Subscription Limit
        await this.subscriptionsService.checkLimit(userId, 'stores');

        // Create Store
        const store = this.storesRepository.create(createStoreDto);
        const savedStore = await this.storesRepository.save(store);

        // Assign Creator as OWNER
        const storeUser = this.storeUsersRepository.create({
            user_id: userId,
            store_id: savedStore.id,
            role: UserRole.OWNER,
        });
        await this.storeUsersRepository.save(storeUser);

        return savedStore;
    }

    async getStoreOwnerId(storeId: string): Promise<string | null> {
        const owner = await this.storeUsersRepository.findOne({
            where: { store_id: storeId, role: 'OWNER' as any }
        });
        return owner?.user_id || null;
    }

    async findAll(userId: string): Promise<Store[]> {
        return this.storesRepository.createQueryBuilder('store')
            .innerJoin('store.users', 'storeUser')
            .where('storeUser.user_id = :userId', { userId })
            .getMany();
    }

    async findOne(userId: string, id: string): Promise<Store> {
        const store = await this.storesRepository.createQueryBuilder('store')
            .innerJoinAndSelect('store.users', 'storeUser') // Load membership to check access
            .where('store.id = :id', { id })
            .andWhere('storeUser.user_id = :userId', { userId })
            .getOne();

        if (!store) {
            throw new NotFoundException(`Store with ID ${id} not found or access denied`);
        }

        return store;
    }

    async update(userId: string, id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
        // Check permissions
        await this.ensureStoreOwner(userId, id);

        const store = await this.storesRepository.findOne({ where: { id } });
        if (!store) throw new NotFoundException('Store not found');

        Object.assign(store, updateStoreDto);
        return this.storesRepository.save(store);
    }

    async remove(userId: string, id: string): Promise<void> {
        // Check permissions
        await this.ensureStoreOwner(userId, id);

        const result = await this.storesRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Store with ID ${id} not found`);
        }
    }

    private async ensureStoreOwner(userId: string, storeId: string): Promise<void> {
        const membership = await this.storeUsersRepository.findOne({
            where: { user_id: userId, store_id: storeId },
        });

        if (!membership || membership.role !== UserRole.OWNER) {
            throw new ForbiddenException('You do not have permission (OWNER required)');
        }
    }
}
