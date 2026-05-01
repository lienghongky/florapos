import { Injectable, Logger, ForbiddenException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { StoreUser, UserRole } from '../stores/entities/store-user.entity';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
    private readonly logger = new Logger(SubscriptionsService.name);

    constructor(
        @InjectRepository(Subscription)
        private subscriptionRepo: Repository<Subscription>,
        @InjectRepository(SubscriptionPlan)
        private planRepo: Repository<SubscriptionPlan>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Store)
        private storeRepo: Repository<Store>,
        @InjectRepository(StoreUser)
        private storeUserRepo: Repository<StoreUser>,
    ) {}

    async onModuleInit() {
        await this.seedPlans();
    }

    private async seedPlans() {
        const plans = [
            {
                name: 'Starter',
                price: 10,
                max_stores: 1,
                max_users: 1,
                features: [],
            },
            {
                name: 'Pro',
                price: 20,
                max_stores: 2,
                max_users: 5,
                features: ['telegram_notifications'],
            },
            {
                name: 'Elite',
                price: 30,
                max_stores: 5,
                max_users: 10,
                features: ['telegram_notifications', 'advanced_reports'],
            },
        ];

        for (const planData of plans) {
            const existing = await this.planRepo.findOne({ where: { name: planData.name } });
            if (!existing) {
                await this.planRepo.save(this.planRepo.create(planData));
                this.logger.log(`Seeded ${planData.name} subscription plan`);
            }
        }
    }

    /**
     * Initializes a new subscription for an owner user.
     * Default: STARTER plan, ACTIVE status.
     */
    async initializeSubscription(userId: string) {
        // Find Starter plan
        const starterPlan = await this.planRepo.findOne({ where: { name: 'Starter' } });
        if (!starterPlan) {
            this.logger.error('Starter plan not found in database. Seed data might be missing.');
            return;
        }

        const subscription = this.subscriptionRepo.create({
            user_id: userId,
            plan_id: starterPlan.id,
            status: SubscriptionStatus.ACTIVE,
            current_period_start: new Date(),
            // No trial for starter by default as per new plan, but logic can be added
        });

        await this.subscriptionRepo.save(subscription);
        this.logger.log(`Initialized Starter subscription for user ${userId}`);
    }

    async getSubscriptionStatus(userId: string) {
        const sub = await this.getSubscription(userId);
        if (!sub) {
            return null;
        }

        // Count current usage
        const ownedStoresCount = await this.storeUserRepo.count({
            where: { user_id: sub.user_id, role: UserRole.OWNER }
        });

        const ownedStoreRoles = await this.storeUserRepo.find({
            where: { user_id: sub.user_id, role: UserRole.OWNER }
        });
        const storeIds = ownedStoreRoles.map(sr => sr.store_id);

        let uniqueUsersCount = 1; // Owner
        if (storeIds.length > 0) {
            const uniqueUsers = await this.storeUserRepo.createQueryBuilder('su')
                .select('DISTINCT su.user_id')
                .where('su.store_id IN (:...storeIds)', { storeIds })
                .getRawMany();
            uniqueUsersCount = uniqueUsers.length;
        }

        return {
            ...sub,
            usage: {
                stores: ownedStoresCount,
                users: uniqueUsersCount,
            },
        };
    }

    /**
     * Checks if a resource (store or user) can be added based on the owner's plan.
     */
    async checkLimit(userId: string, type: 'stores' | 'users'): Promise<void> {
        const sub = await this.getSubscription(userId);
        if (!sub || !sub.plan) return;

        if (type === 'stores') {
            const ownedStoresCount = await this.storeUserRepo.count({
                where: { user_id: userId, role: UserRole.OWNER }
            });

            if (ownedStoresCount >= sub.plan.max_stores) {
                throw new ForbiddenException(`Store limit reached for your plan (${sub.plan.name}). Upgrade to add more stores.`);
            }
        } else if (type === 'users') {
            // Find all stores owned by this user
            const ownedStoreRoles = await this.storeUserRepo.find({
                where: { user_id: userId, role: UserRole.OWNER }
            });
            const storeIds = ownedStoreRoles.map(sr => sr.store_id);

            if (storeIds.length === 0) return;

            // Count unique users across all owned stores
            const uniqueUsers = await this.storeUserRepo.createQueryBuilder('su')
                .select('DISTINCT su.user_id')
                .where('su.store_id IN (:...storeIds)', { storeIds })
                .getRawMany();

            if (uniqueUsers.length >= sub.plan.max_users) {
                throw new ForbiddenException(`User limit reached for your plan (${sub.plan.name}). Upgrade to add more staff.`);
            }
        }
    }

    /**
     * Checks if a specific feature is enabled for the user's plan.
     */
    async hasFeature(userId: string, featureKey: string): Promise<boolean> {
        const sub = await this.getSubscription(userId);
        if (!sub || !sub.plan) return false;
        return sub.plan.features.includes(featureKey);
    }

    /**
     * Enforces limits by deactivating excess resources.
     * Keeps oldest resources active.
     */
    async enforceLimits(ownerId: string) {
        const sub = await this.getSubscription(ownerId);
        if (!sub || !sub.plan) return;

        // 1. Enforce Store Limits
        const ownedStores = await this.storeUserRepo.find({
            where: { user_id: ownerId, role: UserRole.OWNER },
            relations: ['store'],
            order: { created_at: 'ASC' }
        });

        for (let i = 0; i < ownedStores.length; i++) {
            const store = ownedStores[i].store;
            const shouldBeActive = i < sub.plan.max_stores;
            if (store.is_active !== shouldBeActive) {
                await this.storeRepo.update(store.id, { is_active: shouldBeActive });
            }
        }

        // 2. Enforce User Limits
        // Find all users associated with owner's stores
        const storeIds = ownedStores.map(sr => sr.store_id);
        if (storeIds.length > 0) {
            const associations = await this.storeUserRepo.find({
                where: { store_id: In(storeIds) },
                order: { created_at: 'ASC' }
            });

            // Get unique users in order of association
            const uniqueUserIds: string[] = [];
            associations.forEach(a => {
                if (!uniqueUserIds.includes(a.user_id)) {
                    uniqueUserIds.push(a.user_id);
                }
            });

            // Keep owner active + oldest max_users - 1
            for (let i = 0; i < uniqueUserIds.length; i++) {
                const uid = uniqueUserIds[i];
                if (uid === ownerId) continue; // Never deactivate owner

                // We calculate index based on unique users excluding owner
                const userIndex = uniqueUserIds.filter(id => id !== ownerId).indexOf(uid);
                const shouldBeActive = userIndex < (sub.plan.max_users - 1);

                await this.userRepo.update(uid, { is_active: shouldBeActive });
            }
        }
    }

    private async getSubscription(userId: string): Promise<Subscription | null> {
        // We first find if this user has their own subscription (they are an OWNER)
        let sub = await this.subscriptionRepo.findOne({
            where: { user_id: userId },
            relations: ['plan']
        });

        // If not, they might be STAFF. We should find the owner of the store they are in.
        // This is complex for multi-store staff, but usually staff belong to one primary owner.
        if (!sub) {
            const membership = await this.storeUserRepo.findOne({
                where: { user_id: userId, role: UserRole.STAFF },
                relations: ['store', 'store.users']
            });

            if (membership && membership.store) {
                const owner = membership.store.users.find(u => u.role === UserRole.OWNER);
                if (owner) {
                    sub = await this.subscriptionRepo.findOne({
                        where: { user_id: owner.user_id },
                        relations: ['plan']
                    });
                }
            }
        }

        return sub;
    }
}
