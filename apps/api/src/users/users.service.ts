import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UserRole } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { StoreUser } from '../stores/entities/store-user.entity';
import { Order } from '../orders/entities/order.entity';
import { InventoryHistory } from '../inventory/entities/inventory-history.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(StoreUser)
        private storeUserRepository: Repository<StoreUser>,
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(InventoryHistory)
        private inventoryHistoryRepository: Repository<InventoryHistory>,
    ) { }

    async create(createUserDto: CreateUserDto, creatorId?: string): Promise<User> {
        const email = createUserDto.email.toLowerCase();
        const existingUser = await this.usersRepository.findOne({ where: { email } });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const salt = await bcrypt.genSalt();
        const password_hash = await bcrypt.hash(createUserDto.password, salt);

        const user = this.usersRepository.create({
            email: createUserDto.email.toLowerCase(),
            password_hash,
            full_name: createUserDto.full_name,
            is_active: true,
            role: createUserDto.role || UserRole.STAFF,
        });

        const savedUser = await this.usersRepository.save(user);

        // If created by an owner, link them to the owner's store
        if (creatorId) {
            const creatorRoles = await this.storeUserRepository.find({ where: { user_id: creatorId } });
            if (creatorRoles.length > 0) {
                // Link to the same store(s) as staff
                for (const roleEntry of creatorRoles) {
                    await this.storeUserRepository.save(
                        this.storeUserRepository.create({
                            user_id: savedUser.id,
                            store_id: roleEntry.store_id,
                            role: 'STAFF' as any,
                        }),
                    );
                }
            }
        }

        return savedUser;
    }

    async findAll(ownerId?: string, storeId?: string): Promise<User[]> {
        if (!ownerId && !storeId) {
            return this.usersRepository.find({
                relations: ['store_roles']
            });
        }

        const query = this.usersRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.store_roles', 'store_roles');

        if (storeId) {
            query.where('store_roles.store_id = :storeId', { storeId });
        } else if (ownerId) {
            // Get all store IDs where the owner has a role
            const ownerStoreRoles = await this.storeUserRepository.find({
                where: { user_id: ownerId }
            });
            const storeIds = ownerStoreRoles.map(sr => sr.store_id);
            
            if (storeIds.length > 0) {
                query.where('store_roles.store_id IN (:...storeIds)', { storeIds });
            } else {
                query.where('user.id = :ownerId', { ownerId });
            }
        }

        if (ownerId) {
            query.orWhere('user.id = :ownerId', { ownerId });
        }

        return query.getMany();
    }

    async findOne(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['store_roles']
        });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.store_roles', 'store_roles')
            .where('LOWER(user.email) = LOWER(:email)', { email })
            .addSelect('user.password_hash')
            .getOne();
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);

        if (updateUserDto.password) {
            const salt = await bcrypt.genSalt();
            user.password_hash = await bcrypt.hash(updateUserDto.password, salt);
        }

        if (updateUserDto.email) {
            const newEmail = updateUserDto.email.toLowerCase();
            if (newEmail !== user.email) {
                const existing = await this.usersRepository.findOne({ where: { email: newEmail } });
                if (existing) {
                    throw new ConflictException('Email already exists');
                }
                user.email = newEmail;
            }
        }

        if (updateUserDto.full_name) {
            user.full_name = updateUserDto.full_name;
        }

        return this.usersRepository.save(user);
    }

    async toggleActive(id: string): Promise<User> {
        const user = await this.findOne(id);
        user.is_active = !user.is_active;
        return this.usersRepository.save(user);
    }

    async remove(id: string): Promise<void> {
        // Check for references in Orders
        const hasOrders = await this.ordersRepository.findOne({ where: { staff_id: id } });
        if (hasOrders) {
            throw new ConflictException('Cannot delete user: They have associated orders. Deactivate them instead.');
        }

        // Check for references in Inventory History
        const hasHistory = await this.inventoryHistoryRepository.findOne({ where: { performed_by_user_id: id } });
        if (hasHistory) {
            throw new ConflictException('Cannot delete user: They have performed inventory actions. Deactivate them instead.');
        }

        // Delete store associations first
        await this.storeUserRepository.delete({ user_id: id });

        const result = await this.usersRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }

    async createInactive(createUserDto: CreateUserDto, activationToken: string): Promise<User> {
        const email = createUserDto.email.toLowerCase();
        const existingUser = await this.usersRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const salt = await bcrypt.genSalt();
        const password_hash = await bcrypt.hash(createUserDto.password, salt);

        const user = this.usersRepository.create({
            email,
            password_hash,
            full_name: createUserDto.full_name,
            is_active: false,
            activation_token: activationToken,
        });

        return this.usersRepository.save(user);
    }

    async activateUser(token: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { activation_token: token } });
        if (!user) {
            throw new NotFoundException('Invalid activation token');
        }
        user.is_active = true;
        user.activation_token = null;
        return this.usersRepository.save(user);
    }
}
