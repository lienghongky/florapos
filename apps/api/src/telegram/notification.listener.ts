import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from './events/order-created.event';
import { TelegramService } from './telegram.service';
import { NotificationQueueService } from './notification-queue.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

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
        private readonly configService: ConfigService,
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

            // Gather all items with images
            const itemsWithImages = event.items
                .filter(item => item.image_url)
                .map(item => ({
                    name: item.name,
                    path: this.resolveImagePath(item.image_url!),
                }))
                .filter(item => item.path !== null);

            if (itemsWithImages.length > 1) {
                // Send as album (Media Group)
                const media: { type: 'photo', media: string, caption?: string }[] = itemsWithImages.slice(0, 10).map((item, index) => ({
                    type: 'photo',
                    media: item.path!,
                    // Put the full message as caption on the first image only
                    caption: index === 0 ? message : undefined,
                    parse_mode: 'HTML' as any,
                }));
                this.notificationQueue.enqueueManyMediaGroups(chatIds, media);
            } else if (itemsWithImages.length === 1) {
                // Send as single photo with caption
                this.notificationQueue.enqueueManyPhotos(chatIds, itemsWithImages[0].path!, message);
            } else {
                // Send as regular text message
                this.notificationQueue.enqueueMany(chatIds, message);
            }

            this.logger.log(
                `Queued order notification for ${chatIds.length} recipient(s) with ${itemsWithImages.length} image(s)`,
            );
        } catch (error) {
            this.logger.error(`Failed to handle order.created event: ${error.message}`);
        }
    }

    private resolveImagePath(imagePath: string): string | null {
        if (!imagePath) return null;
        
        // If it's already a full URL, keep it as is
        if (imagePath.startsWith('http')) return imagePath;

        // Clean the path (remove leading slashes and common prefixes)
        let cleanPath = imagePath.replace(/^\//, '');
        
        // The image path in DB might be "uploads/products/..." or "products/..."
        // We want to find the absolute path to the file.
        
        // Try to find where the "uploads" folder actually is relative to where we are
        const possibleRoots = [
            process.cwd(), // Root
            path.join(process.cwd(), 'apps/api'), // If running from root
        ];

        for (const root of possibleRoots) {
            // Try different combinations
            const trials = [
                path.join(root, 'uploads', cleanPath.replace('uploads/', '')),
                path.join(root, cleanPath),
            ];

            for (const trial of trials) {
                if (fs.existsSync(trial) && fs.statSync(trial).isFile()) {
                    return trial;
                }
            }
        }

        this.logger.warn(`Local image file not found after trying multiple locations for: ${imagePath}`);
        return null;
    }

    private formatOrderNotification(event: OrderCreatedEvent): string {
        const total = Number(event.grand_total).toFixed(2);
        const itemNames = event.items.map(i => i.name).join(', ');
        
        return [
            `🧾 <b>New Order #${event.order_number}</b>`,
            ``,
            `💰 Total: <b>$${total}</b>`,
            `📦 Items: ${event.item_count} (${itemNames})`,
            `👤 Staff: ${event.staff_name}`,
            `💳 Payment: ${event.payment_method}`,
            ``,
            `<i>— FloraPos Notification</i>`,
        ].join('\n');
    }
}
