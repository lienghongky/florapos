import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class SubscriptionExpiryJob {
    private readonly logger = new Logger(SubscriptionExpiryJob.name);

    constructor(
        @InjectRepository(Subscription)
        private subscriptionRepo: Repository<Subscription>,
        @InjectRepository(SubscriptionPlan)
        private planRepo: Repository<SubscriptionPlan>,
        private subscriptionsService: SubscriptionsService,
    ) {}

    /**
     * Runs every day at midnight to handle trial expirations.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleTrialExpiration() {
        this.logger.log('Checking for expired trials...');

        const now = new Date();
        const expiredTrials = await this.subscriptionRepo.find({
            where: {
                status: SubscriptionStatus.TRIALING,
                trial_end_at: LessThan(now),
            },
        });

        if (expiredTrials.length === 0) {
            this.logger.log('No expired trials found.');
            return;
        }

        const starterPlan = await this.planRepo.findOne({ where: { name: 'Starter' } });
        if (!starterPlan) {
            this.logger.error('Starter plan not found. Cannot downgrade accounts.');
            return;
        }

        for (const sub of expiredTrials) {
            try {
                this.logger.log(`Downgrading account for user ${sub.user_id} due to trial expiration.`);
                
                // Update subscription to Starter
                await this.subscriptionRepo.update(sub.id, {
                    plan_id: starterPlan.id,
                    status: SubscriptionStatus.ACTIVE,
                    trial_end_at: null,
                });

                // Enforce limits (deactivate excess stores/users)
                await this.subscriptionsService.enforceLimits(sub.user_id);
                
                this.logger.log(`Successfully downgraded user ${sub.user_id}`);
            } catch (error) {
                this.logger.error(`Failed to downgrade user ${sub.user_id}: ${error.message}`);
            }
        }
    }
}
