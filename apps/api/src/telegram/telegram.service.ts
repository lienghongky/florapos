import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { TelegramAccount } from './entities/telegram-account.entity';
import { TelegramLinkToken } from './entities/telegram-link-token.entity';
import { StoreUser } from '../stores/entities/store-user.entity';
import * as crypto from 'crypto';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);

    /**
     * Simple in-memory rate limiter: chat_id → last message timestamp.
     * Prevents more than 1 message per second per chat (Telegram limit is ~30/sec globally).
     */
    private rateLimitMap = new Map<number, number>();
    private readonly RATE_LIMIT_MS = 1000; // 1 message per second per chat

    constructor(
        @InjectBot() private bot: Telegraf,
        @InjectRepository(TelegramAccount)
        private telegramAccountRepo: Repository<TelegramAccount>,
        @InjectRepository(TelegramLinkToken)
        private linkTokenRepo: Repository<TelegramLinkToken>,
        @InjectRepository(StoreUser)
        private storeUserRepo: Repository<StoreUser>,
    ) {}

    // ── Account Management ───────────────────────────────────────────────

    async findAccountByChatId(chatId: number): Promise<TelegramAccount | null> {
        return this.telegramAccountRepo.findOne({ where: { chat_id: chatId } });
    }

    async findAccountByUserId(userId: string): Promise<TelegramAccount | null> {
        return this.telegramAccountRepo.findOne({ where: { user_id: userId } });
    }

    async findActiveAccountsByStoreId(storeId: string): Promise<TelegramAccount[]> {
        // Find all users in this store, then find their active Telegram accounts
        const storeUsers = await this.storeUserRepo.find({ where: { store_id: storeId } });
        if (storeUsers.length === 0) return [];

        const userIds = storeUsers.map(su => su.user_id);
        return this.telegramAccountRepo
            .createQueryBuilder('ta')
            .where('ta.user_id IN (:...userIds)', { userIds })
            .andWhere('ta.is_active = :active', { active: true })
            .getMany();
    }

    async linkAccount(userId: string, chatId: number, username?: string): Promise<TelegramAccount> {
        // Check if already linked
        const existing = await this.telegramAccountRepo.findOne({ where: { user_id: userId } });
        if (existing) {
            existing.chat_id = chatId;
            existing.username = username || existing.username;
            existing.is_active = true;
            return this.telegramAccountRepo.save(existing);
        }

        // Get user's first store as default active store
        const firstStoreUser = await this.storeUserRepo.findOne({ where: { user_id: userId } });

        const account = this.telegramAccountRepo.create({
            user_id: userId,
            chat_id: chatId,
            username: username || null,
            is_active: true,
            active_store_id: firstStoreUser?.store_id || null,
        });

        return this.telegramAccountRepo.save(account);
    }

    async unlinkAccount(userId: string): Promise<void> {
        await this.telegramAccountRepo.delete({ user_id: userId });
    }

    async updatePreferences(
        chatId: number,
        prefs: Partial<Pick<TelegramAccount, 'notify_orders' | 'notify_daily_summary' | 'notify_low_stock'>>,
    ): Promise<TelegramAccount | null> {
        const account = await this.findAccountByChatId(chatId);
        if (!account) return null;
        Object.assign(account, prefs);
        return this.telegramAccountRepo.save(account);
    }

    async setActiveStore(chatId: number, storeId: string): Promise<TelegramAccount | null> {
        const account = await this.findAccountByChatId(chatId);
        if (!account) return null;
        account.active_store_id = storeId;
        return this.telegramAccountRepo.save(account);
    }

    // ── Link Token Management ────────────────────────────────────────────

    async generateLinkToken(userId: string): Promise<string> {
        // Invalidate any existing unused tokens for this user
        await this.linkTokenRepo.update(
            { user_id: userId, used: false },
            { used: true },
        );

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await this.linkTokenRepo.save(
            this.linkTokenRepo.create({
                user_id: userId,
                token,
                expires_at: expiresAt,
            }),
        );

        return token;
    }

    async validateAndConsumeToken(token: string): Promise<{ userId: string } | null> {
        const linkToken = await this.linkTokenRepo.findOne({
            where: { token, used: false },
        });

        if (!linkToken) return null;
        if (new Date() > linkToken.expires_at) return null;

        linkToken.used = true;
        await this.linkTokenRepo.save(linkToken);

        return { userId: linkToken.user_id };
    }

    // ── Message Sending ──────────────────────────────────────────────────

    async sendMessage(chatId: number, text: string, options?: any): Promise<boolean> {
        // Rate limiting
        const now = Date.now();
        const lastSent = this.rateLimitMap.get(chatId) || 0;
        if (now - lastSent < this.RATE_LIMIT_MS) {
            const waitMs = this.RATE_LIMIT_MS - (now - lastSent);
            await new Promise(resolve => setTimeout(resolve, waitMs));
        }

        try {
            await this.bot.telegram.sendMessage(chatId, text, {
                parse_mode: 'HTML',
                ...options,
            });
            this.rateLimitMap.set(chatId, Date.now());
            return true;
        } catch (error) {
            this.logger.error(`Failed to send message to chat ${chatId}: ${error.message}`);
            // If user blocked the bot, deactivate their account
            if (error.response?.error_code === 403) {
                this.logger.warn(`User blocked bot. Deactivating chat_id ${chatId}`);
                await this.telegramAccountRepo.update({ chat_id: chatId }, { is_active: false });
            }
            return false;
        }
    }

    // ── Store Resolution ─────────────────────────────────────────────────

    async getUserStores(userId: string): Promise<StoreUser[]> {
        return this.storeUserRepo.find({
            where: { user_id: userId },
            relations: ['store'],
        });
    }

    // ── Bot Info ─────────────────────────────────────────────────────────

    async getBotUsername(): Promise<string> {
        try {
            const me = await this.bot.telegram.getMe();
            return me.username;
        } catch {
            return 'your_bot';
        }
    }
}
