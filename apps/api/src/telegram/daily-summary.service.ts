import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TelegramAccount } from './entities/telegram-account.entity';
import { NotificationQueueService } from './notification-queue.service';
import { OrdersService } from '../orders/orders.service';
import { StoreUser } from '../stores/entities/store-user.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { StoresService } from '../stores/stores.service';

/**
 * Sends a daily sales summary via Telegram at 20:00 (Asia/Phnom_Penh).
 * Only sends to users who have notify_daily_summary enabled.
 */
@Injectable()
export class DailySummaryService {
    private readonly logger = new Logger(DailySummaryService.name);

    constructor(
        @InjectRepository(TelegramAccount)
        private telegramAccountRepo: Repository<TelegramAccount>,
        @InjectRepository(StoreUser)
        private storeUserRepo: Repository<StoreUser>,
        private readonly notificationQueue: NotificationQueueService,
        private readonly ordersService: OrdersService,
        private readonly subscriptionsService: SubscriptionsService,
        private readonly storesService: StoresService,
    ) {}

    /**
     * Cron job: runs daily at 20:00 UTC+7 (13:00 UTC).
     */
    @Cron('0 13 * * *') // 13:00 UTC = 20:00 ICT (UTC+7)
    async sendDailySummary(): Promise<void> {
        this.logger.log('Starting daily summary job...');

        try {
            // Get all active accounts with daily summary enabled
            const accounts = await this.telegramAccountRepo.find({
                where: {
                    is_active: true,
                    notify_daily_summary: true,
                },
            });

            if (accounts.length === 0) {
                this.logger.log('No accounts subscribed to daily summary');
                return;
            }

            // Group accounts by their active store
            const storeAccountsMap = new Map<string, TelegramAccount[]>();
            for (const account of accounts) {
                if (!account.active_store_id) continue;
                const storeId = account.active_store_id;
                if (!storeAccountsMap.has(storeId)) {
                    storeAccountsMap.set(storeId, []);
                }
                storeAccountsMap.get(storeId)!.push(account);
            }

            // For each store, fetch stats and send summary
            for (const [storeId, storeAccounts] of storeAccountsMap) {
                try {
                    // Check if owner has the feature
                    const ownerId = await this.storesService.getStoreOwnerId(storeId);
                    if (!ownerId) continue;

                    const hasTelegramFeature = await this.subscriptionsService.hasFeature(ownerId, 'telegram_notifications');
                    if (!hasTelegramFeature) {
                        this.logger.debug(`Store owner ${ownerId} for store ${storeId} does not have telegram_notifications enabled. Skipping daily summary.`);
                        continue;
                    }

                    const firstAccount = storeAccounts[0];
                    const today = new Date();
                    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                    const stats = await this.ordersService.getStats(
                        firstAccount.user_id,
                        storeId,
                        dateStr,
                        dateStr,
                    );

                    const topProducts = stats.top_products
                        .slice(0, 3)
                        .map((p: any, i: number) => `  ${i + 1}. ${p.name} — ${p.quantity} sold`)
                        .join('\n') || '  No sales today';

                    const message = [
                        `📋 <b>Daily Sales Summary</b>`,
                        `📅 ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`,
                        ``,
                        `💰 Total Revenue: <b>$${Number(stats.total_revenue).toFixed(2)}</b>`,
                        `🧾 Total Orders: <b>${stats.total_orders}</b>`,
                        `📈 Avg Order: <b>$${Number(stats.avg_order_value).toFixed(2)}</b>`,
                        ``,
                        `🏆 <b>Top 3 Products:</b>`,
                        topProducts,
                        ``,
                        `<i>— FloraPos Daily Report</i>`,
                    ].join('\n');

                    const chatIds = storeAccounts.map(a => Number(a.chat_id));
                    this.notificationQueue.enqueueMany(chatIds, message);

                    this.logger.log(`Queued daily summary for store ${storeId} to ${chatIds.length} recipient(s)`);
                } catch (error) {
                    this.logger.error(`Failed to generate summary for store ${storeId}: ${error.message}`);
                }
            }

            this.logger.log('Daily summary job completed');
        } catch (error) {
            this.logger.error(`Daily summary job failed: ${error.message}`);
        }
    }
}
