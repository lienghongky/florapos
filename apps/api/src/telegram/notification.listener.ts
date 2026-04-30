import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from './events/order-created.event';
import { TelegramService } from './telegram.service';
import { NotificationQueueService } from './notification-queue.service';

/**
 * Listens for POS events and dispatches Telegram notifications
 * through the async queue (non-blocking).
 */
@Injectable()
export class NotificationListener {
    private readonly logger = new Logger(NotificationListener.name);

    constructor(
        private readonly telegramService: TelegramService,
        private readonly notificationQueue: NotificationQueueService,
    ) {}

    @OnEvent('order.created')
    async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
        this.logger.log(`Order created event: #${event.order_number} in store ${event.store_id}`);

        try {
            // Find all active Telegram accounts for this store
            const accounts = await this.telegramService.findActiveAccountsByStoreId(event.store_id);

            if (accounts.length === 0) {
                this.logger.debug('No Telegram accounts linked for this store');
                return;
            }

            // Filter accounts that have order notifications enabled
            const notifyAccounts = accounts.filter(a => a.notify_orders);

            if (notifyAccounts.length === 0) {
                this.logger.debug('All linked accounts have order notifications disabled');
                return;
            }

            // Format the notification message
            const message = this.formatOrderNotification(event);
            const chatIds = notifyAccounts.map(a => Number(a.chat_id));

            // Enqueue for async delivery (does not block)
            this.notificationQueue.enqueueMany(chatIds, message);

            this.logger.log(
                `Queued order notification for ${chatIds.length} recipient(s)`,
            );
        } catch (error) {
            this.logger.error(`Failed to handle order.created event: ${error.message}`);
        }
    }

    private formatOrderNotification(event: OrderCreatedEvent): string {
        const total = Number(event.grand_total).toFixed(2);
        return [
            `🧾 <b>New Order #${event.order_number}</b>`,
            ``,
            `💰 Total: <b>$${total}</b>`,
            `📦 Items: ${event.item_count}`,
            `👤 Staff: ${event.staff_name}`,
            `💳 Payment: ${event.payment_method}`,
            ``,
            `<i>— FloraPos Notification</i>`,
        ].join('\n');
    }
}
