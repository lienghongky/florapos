import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { StoreUser, UserRole as StoreUserRole } from '../stores/entities/store-user.entity';
import { SaaSPayment } from './entities/saas-payment.entity';
import { UserRole } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';
import { TelegramAccount } from '../telegram/entities/telegram-account.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';

@Injectable()
export class MasterService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Store)
        private storesRepository: Repository<Store>,
        @InjectRepository(StoreUser)
        private storeUsersRepository: Repository<StoreUser>,
        @InjectRepository(SaaSPayment)
        private saasPaymentsRepository: Repository<SaaSPayment>,
        @InjectRepository(TelegramAccount)
        private telegramAccountRepo: Repository<TelegramAccount>,
        @InjectRepository(SystemSetting)
        private systemSettingRepo: Repository<SystemSetting>,
        @InjectRepository(Subscription)
        private subscriptionRepo: Repository<Subscription>,
        @InjectRepository(SubscriptionPlan)
        private planRepo: Repository<SubscriptionPlan>,
    ) { }

    async getAllSubscriptions() {
        return this.subscriptionRepo.find({
            relations: ['user', 'plan'],
            order: { created_at: 'DESC' }
        });
    }

    async getPlans() {
        return this.planRepo.find({ order: { price: 'ASC' } });
    }

    async updateSubscription(userId: string, updateData: { 
        plan_id?: string, 
        status?: SubscriptionStatus, 
        trial_end_at?: Date | null,
        current_period_start?: Date | null,
        current_period_end?: Date | null,
        is_auto_renew?: boolean,
        cancel_at_period_end?: boolean
    }) {
        let sub = await this.subscriptionRepo.findOne({ where: { user_id: userId } });
        
        if (!sub) {
            // Create new subscription if missing
            if (!updateData.plan_id) throw new NotFoundException('Subscription missing. Please provide a plan_id to initialize.');
            
            sub = this.subscriptionRepo.create({
                user_id: userId,
                plan_id: updateData.plan_id,
                status: updateData.status || SubscriptionStatus.ACTIVE,
                trial_end_at: updateData.trial_end_at || null,
                current_period_start: updateData.current_period_start || new Date(),
                current_period_end: updateData.current_period_end || null,
                is_auto_renew: updateData.is_auto_renew ?? true,
                cancel_at_period_end: updateData.cancel_at_period_end ?? false,
            });
        } else {
            if (updateData.plan_id) sub.plan_id = updateData.plan_id;
            if (updateData.status) sub.status = updateData.status;
            if (updateData.trial_end_at !== undefined) sub.trial_end_at = updateData.trial_end_at;
            if (updateData.current_period_start !== undefined) sub.current_period_start = updateData.current_period_start;
            if (updateData.current_period_end !== undefined) sub.current_period_end = updateData.current_period_end;
            if (updateData.is_auto_renew !== undefined) sub.is_auto_renew = updateData.is_auto_renew;
            if (updateData.cancel_at_period_end !== undefined) sub.cancel_at_period_end = updateData.cancel_at_period_end;
        }

        return this.subscriptionRepo.save(sub);
    }

    async getSaaSStats() {
        const totalOwners = await this.usersRepository.count({ where: { role: UserRole.OWNER } });
        const totalStores = await this.storesRepository.count();
        const totalStaff = await this.usersRepository.count({ where: { role: UserRole.STAFF } });
        const totalTelegramLinks = await this.telegramAccountRepo.count();
        
        return {
            totalOwners,
            totalStores,
            totalStaff,
            totalTelegramLinks,
        };
    }

    async getAllOwners() {
        return this.usersRepository.find({
            where: { role: UserRole.OWNER },
            relations: ['store_roles', 'store_roles.store'],
            order: { created_at: 'DESC' }
        });
    }

    async toggleUserActive(id: string) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        
        user.is_active = !user.is_active;
        return this.usersRepository.save(user);
    }

    async createOwner(ownerData: { email: string, full_name: string, password: string }) {
        const existing = await this.usersRepository.findOne({ where: { email: ownerData.email.toLowerCase() } });
        if (existing) throw new ConflictException('Email already exists');

        const salt = await bcrypt.genSalt();
        const password_hash = await bcrypt.hash(ownerData.password, salt);

        const user = this.usersRepository.create({
            email: ownerData.email.toLowerCase(),
            full_name: ownerData.full_name,
            password_hash,
            role: UserRole.OWNER,
            is_active: true,
        });

        return this.usersRepository.save(user);
    }

    async createStoreForOwner(ownerId: string, storeData: { name: string, currency: string }) {
        const owner = await this.usersRepository.findOne({ where: { id: ownerId, role: UserRole.OWNER } });
        if (!owner) throw new NotFoundException('Owner not found');

        const store = this.storesRepository.create(storeData);
        const savedStore = await this.storesRepository.save(store);

        const storeUser = this.storeUsersRepository.create({
            user_id: ownerId,
            store_id: savedStore.id,
            role: StoreUserRole.OWNER,
        });
        await this.storeUsersRepository.save(storeUser);

        return savedStore;
    }

    async getOwnerStaff(ownerId: string) {
        // Find all stores owned by this owner
        const ownerships = await this.storeUsersRepository.find({
            where: { user_id: ownerId, role: StoreUserRole.OWNER },
        });

        if (ownerships.length === 0) return [];

        const storeIds = ownerships.map(o => o.store_id);

        // Find all users linked to these stores as STAFF
        return this.storeUsersRepository.find({
            where: storeIds.map(sid => ({ store_id: sid, role: StoreUserRole.STAFF })),
            relations: ['user', 'store']
        });
    }

    async getAllStores() {
        return this.storesRepository.find({
            relations: ['users', 'users.user'],
            order: { created_at: 'DESC' }
        });
    }

    async updateStore(id: string, updateData: { name?: string, currency?: string }) {
        const store = await this.storesRepository.findOne({ where: { id } });
        if (!store) throw new NotFoundException('Store not found');
        
        if (updateData.name) store.name = updateData.name;
        if (updateData.currency) store.currency = updateData.currency;
        
        return this.storesRepository.save(store);
    }

    async transferOwnership(storeId: string, newOwnerId: string) {
        const store = await this.storesRepository.findOne({ where: { id: storeId } });
        if (!store) throw new NotFoundException('Store not found');

        const newOwner = await this.usersRepository.findOne({ where: { id: newOwnerId, role: UserRole.OWNER } });
        if (!newOwner) throw new NotFoundException('New owner not found or is not an OWNER user');

        // Find current owner and downgrade to STAFF
        const currentOwnerships = await this.storeUsersRepository.find({
            where: { store_id: storeId, role: StoreUserRole.OWNER }
        });

        for (const ownership of currentOwnerships) {
            ownership.role = StoreUserRole.STAFF;
            await this.storeUsersRepository.save(ownership);
        }

        // Check if new owner is already STAFF in this store
        const existingMembership = await this.storeUsersRepository.findOne({
            where: { store_id: storeId, user_id: newOwnerId }
        });

        if (existingMembership) {
            existingMembership.role = StoreUserRole.OWNER;
            await this.storeUsersRepository.save(existingMembership);
        } else {
            const newOwnership = this.storeUsersRepository.create({
                store_id: storeId,
                user_id: newOwnerId,
                role: StoreUserRole.OWNER,
            });
            await this.storeUsersRepository.save(newOwnership);
        }

        return this.storesRepository.findOne({
            where: { id: storeId },
            relations: ['users', 'users.user']
        });
    }

    async recordPayment(data: {
        owner_id: string;
        amount: number;
        currency: string;
        payment_date: string;
        coverage_start_date: string;
        coverage_end_date: string;
        notes?: string;
    }) {
        const owner = await this.usersRepository.findOne({ where: { id: data.owner_id, role: UserRole.OWNER } });
        if (!owner) throw new NotFoundException('Owner not found');

        const payment = this.saasPaymentsRepository.create({
            owner_id: data.owner_id,
            amount: data.amount,
            currency: data.currency,
            payment_date: new Date(data.payment_date),
            coverage_start_date: new Date(data.coverage_start_date),
            coverage_end_date: new Date(data.coverage_end_date),
            notes: data.notes,
        });

        return this.saasPaymentsRepository.save(payment);
    }

    async getAllPayments() {
        return this.saasPaymentsRepository.find({
            relations: ['owner'],
            order: { payment_date: 'DESC', created_at: 'DESC' }
        });
    }

    async getOwnerPayments(ownerId: string) {
        return this.saasPaymentsRepository.find({
            where: { owner_id: ownerId },
            order: { coverage_start_date: 'DESC' }
        });
    }

    async updateUserPassword(id: string, newPassword: string) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        const salt = await bcrypt.genSalt();
        user.password_hash = await bcrypt.hash(newPassword, salt);
        
        return this.usersRepository.save(user);
    }

    async getAllStaff() {
        return this.usersRepository.find({
            where: { role: UserRole.STAFF },
            relations: ['store_roles', 'store_roles.store'],
            order: { created_at: 'DESC' }
        });
    }

    async deleteUser(id: string) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return this.usersRepository.remove(user);
    }

    // ── Telegram Management ──────────────────────────────────────────────

    async getAllTelegramAccounts() {
        return this.telegramAccountRepo.find({
            relations: ['user'],
            order: { created_at: 'DESC' }
        });
    }

    async disconnectTelegramAccount(id: string) {
        const account = await this.telegramAccountRepo.findOne({ where: { id } });
        if (!account) throw new NotFoundException('Telegram link not found');
        return this.telegramAccountRepo.remove(account);
    }

    async toggleTelegramAccount(id: string) {
        const account = await this.telegramAccountRepo.findOne({ where: { id } });
        if (!account) throw new NotFoundException('Telegram link not found');
        account.is_active = !account.is_active;
        return this.telegramAccountRepo.save(account);
    }

    // ── System Settings ──────────────────────────────────────────────────

    async getSetting(key: string, defaultValue: string = ''): Promise<string> {
        const setting = await this.systemSettingRepo.findOne({ where: { key } });
        return setting ? setting.value : defaultValue;
    }

    async setSetting(key: string, value: string): Promise<SystemSetting> {
        let setting = await this.systemSettingRepo.findOne({ where: { key } });
        if (!setting) {
            setting = this.systemSettingRepo.create({ key, value });
        } else {
            setting.value = value;
        }
        return this.systemSettingRepo.save(setting);
    }
}
