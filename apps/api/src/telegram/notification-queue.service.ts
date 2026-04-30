import { Injectable, Logger } from '@nestjs/common';
import { TelegramService } from './telegram.service';

interface NotificationJob {
    chatId: number;
    text: string;
    options?: any;
    retries: number;
    maxRetries: number;
}

/**
 * Simple in-process async notification queue.
 * Processes messages outside the request lifecycle with retry logic.
 * No Redis dependency — jobs are lost on restart (acceptable tradeoff for simplicity).
 */
@Injectable()
export class NotificationQueueService {
    private readonly logger = new Logger(NotificationQueueService.name);
    private queue: NotificationJob[] = [];
    private processing = false;

    constructor(private readonly telegramService: TelegramService) {}

    /**
     * Enqueue a notification to be sent asynchronously.
     * Returns immediately — does NOT block the caller.
     */
    enqueue(chatId: number, text: string, options?: any): void {
        this.queue.push({
            chatId,
            text,
            options,
            retries: 0,
            maxRetries: 3,
        });

        // Kick off processing if not already running
        if (!this.processing) {
            this.processQueue();
        }
    }

    /**
     * Enqueue messages for multiple recipients.
     */
    enqueueMany(chatIds: number[], text: string, options?: any): void {
        for (const chatId of chatIds) {
            this.enqueue(chatId, text, options);
        }
    }

    private async processQueue(): Promise<void> {
        if (this.processing) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const job = this.queue.shift()!;

            try {
                const success = await this.telegramService.sendMessage(
                    job.chatId,
                    job.text,
                    job.options,
                );

                if (!success && job.retries < job.maxRetries) {
                    // Retry with exponential backoff
                    const delay = Math.pow(2, job.retries) * 1000;
                    this.logger.warn(
                        `Retrying notification to ${job.chatId} (attempt ${job.retries + 1}/${job.maxRetries}) in ${delay}ms`,
                    );
                    await new Promise(resolve => setTimeout(resolve, delay));
                    job.retries++;
                    this.queue.push(job); // Re-add to back of queue
                }
            } catch (error) {
                this.logger.error(
                    `Notification queue error for chat ${job.chatId}: ${error.message}`,
                );

                if (job.retries < job.maxRetries) {
                    const delay = Math.pow(2, job.retries) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    job.retries++;
                    this.queue.push(job);
                } else {
                    this.logger.error(
                        `Giving up on notification to ${job.chatId} after ${job.maxRetries} retries`,
                    );
                }
            }
        }

        this.processing = false;
    }
}
