import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, Action, InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf, Markup } from 'telegraf';
import { TelegramService } from './telegram.service';
import { OrdersService } from '../orders/orders.service';

import { SkipThrottle } from '@nestjs/throttler';

/**
 * Telegraf Update handler — the "controller" for Telegram bot interactions.
 * Handles /start, /menu, /settings, inline button callbacks, and text messages.
 */
@SkipThrottle()
@Update()
export class TelegramUpdate {
    private readonly logger = new Logger(TelegramUpdate.name);

    constructor(
        @InjectBot() private bot: Telegraf,
        private readonly telegramService: TelegramService,
        private readonly ordersService: OrdersService,
    ) {}

    // ── /start <token> — Link Account ────────────────────────────────────

    @Start()
    async onStart(@Ctx() ctx: Context): Promise<void> {
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        const username = (ctx.from as any)?.username;
        const payload = (ctx as any).startPayload; // token from deep link

        if (!payload) {
            // No token provided
            const existing = await this.telegramService.findAccountByChatId(chatId);
            if (existing) {
                await ctx.reply(
                    `✅ Your account is already linked!\n\nUse /menu to see available options.`,
                );
            } else {
                await ctx.reply(
                    `👋 Welcome to FloraPos Bot!\n\n` +
                    `To link your account, ask your store owner/manager for an invite link.\n\n` +
                    `The link will look like:\nhttps://t.me/bot_name?start=<token>`,
                );
            }
            return;
        }

        // Validate and consume the token
        const result = await this.telegramService.validateAndConsumeToken(payload);
        if (!result) {
            await ctx.reply(
                `❌ Invalid or expired link token.\n\nPlease request a new invite link from your manager.`,
            );
            return;
        }

        // Link the account
        await this.telegramService.linkAccount(result.userId, chatId, username);
        this.logger.log(`Linked Telegram account: chat_id=${chatId} → user_id=${result.userId}`);

        await ctx.reply(
            `🎉 Account linked successfully!\n\n` +
            `You will now receive notifications from your store.\n\n` +
            `Use /menu to see available options.\n` +
            `Use /settings to manage your notification preferences.`,
        );
    }

    // ── /menu — Show Main Menu ───────────────────────────────────────────

    @Command('menu')
    async onMenu(@Ctx() ctx: Context): Promise<void> {
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        const account = await this.telegramService.findAccountByChatId(chatId);

        if (!account) {
            await ctx.reply('❌ Your account is not linked. Please use an invite link to connect.');
            return;
        }

        await ctx.reply(
            '📋 <b>FloraPos Menu</b>\n\nWhat would you like to do?',
            {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📊 Today\'s Sales', 'action_today_sales')],
                    [Markup.button.callback('🏪 Switch Store', 'action_switch_store')],
                    [Markup.button.callback('⚙️ Notification Settings', 'action_settings')],
                ]),
            },
        );
    }

    // ── /settings — Notification Preferences ─────────────────────────────

    @Command('settings')
    async onSettings(@Ctx() ctx: Context): Promise<void> {
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        await this.showSettingsMenu(ctx, chatId);
    }

    @Action('action_settings')
    async onSettingsAction(@Ctx() ctx: Context): Promise<void> {
        await ctx.answerCbQuery();
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        await this.showSettingsMenu(ctx, chatId);
    }

    private async showSettingsMenu(ctx: Context, chatId: number): Promise<void> {
        const account = await this.telegramService.findAccountByChatId(chatId);
        if (!account) {
            await ctx.reply('❌ Account not linked.');
            return;
        }

        const orderIcon = account.notify_orders ? '✅' : '❌';
        const summaryIcon = account.notify_daily_summary ? '✅' : '❌';
        const stockIcon = account.notify_low_stock ? '✅' : '❌';

        await ctx.reply(
            `⚙️ <b>Notification Settings</b>\n\nTap to toggle:`,
            {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback(`${orderIcon} Order Notifications`, 'toggle_orders')],
                    [Markup.button.callback(`${summaryIcon} Daily Summary`, 'toggle_summary')],
                    [Markup.button.callback(`${stockIcon} Low Stock Alerts`, 'toggle_stock')],
                    [Markup.button.callback('◀️ Back to Menu', 'action_menu')],
                ]),
            },
        );
    }

    // ── Settings Toggle Handlers ─────────────────────────────────────────

    @Action('toggle_orders')
    async onToggleOrders(@Ctx() ctx: Context): Promise<void> {
        await ctx.answerCbQuery();
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        const account = await this.telegramService.findAccountByChatId(chatId);
        if (!account) return;
        await this.telegramService.updatePreferences(chatId, { notify_orders: !account.notify_orders });
        await this.showSettingsMenu(ctx, chatId);
    }

    @Action('toggle_summary')
    async onToggleSummary(@Ctx() ctx: Context): Promise<void> {
        await ctx.answerCbQuery();
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        const account = await this.telegramService.findAccountByChatId(chatId);
        if (!account) return;
        await this.telegramService.updatePreferences(chatId, { notify_daily_summary: !account.notify_daily_summary });
        await this.showSettingsMenu(ctx, chatId);
    }

    @Action('toggle_stock')
    async onToggleStock(@Ctx() ctx: Context): Promise<void> {
        await ctx.answerCbQuery();
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        const account = await this.telegramService.findAccountByChatId(chatId);
        if (!account) return;
        await this.telegramService.updatePreferences(chatId, { notify_low_stock: !account.notify_low_stock });
        await this.showSettingsMenu(ctx, chatId);
    }

    // ── Today's Sales ────────────────────────────────────────────────────

    @Action('action_today_sales')
    async onTodaySales(@Ctx() ctx: Context): Promise<void> {
        await ctx.answerCbQuery();
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        const account = await this.telegramService.findAccountByChatId(chatId);

        if (!account) {
            await ctx.reply('❌ Account not linked.');
            return;
        }

        if (!account.active_store_id) {
            await ctx.reply('⚠️ No store selected. Use /menu → Switch Store first.');
            return;
        }

        try {
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const stats = await this.ordersService.getStats(
                account.user_id,
                account.active_store_id,
                dateStr,
                dateStr,
            );

            const topProductsText = stats.top_products.length > 0
                ? stats.top_products
                    .slice(0, 5)
                    .map((p: any, i: number) => `  ${i + 1}. ${p.name} — ${p.quantity} sold ($${Number(p.revenue).toFixed(2)})`)
                    .join('\n')
                : '  No sales yet today';

            const message = [
                `📊 <b>Today's Sales Summary</b>`,
                `📅 ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
                ``,
                `💰 Revenue: <b>$${Number(stats.total_revenue).toFixed(2)}</b>`,
                `🧾 Orders: <b>${stats.total_orders}</b>`,
                `📈 Avg Order: <b>$${Number(stats.avg_order_value).toFixed(2)}</b>`,
                ``,
                `🏆 <b>Top Products:</b>`,
                topProductsText,
                ``,
                `<i>— FloraPos</i>`,
            ].join('\n');

            await ctx.reply(message, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 Refresh', 'action_today_sales')],
                    [Markup.button.callback('◀️ Back to Menu', 'action_menu')],
                ]),
            });
        } catch (error) {
            this.logger.error(`Failed to fetch sales stats: ${error.message}`);
            await ctx.reply('❌ Failed to fetch sales data. Please try again later.');
        }
    }

    // ── Switch Store ─────────────────────────────────────────────────────

    @Action('action_switch_store')
    async onSwitchStore(@Ctx() ctx: Context): Promise<void> {
        await ctx.answerCbQuery();
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        const account = await this.telegramService.findAccountByChatId(chatId);

        if (!account) {
            await ctx.reply('❌ Account not linked.');
            return;
        }

        const storeUsers = await this.telegramService.getUserStores(account.user_id);

        if (storeUsers.length === 0) {
            await ctx.reply('⚠️ You are not assigned to any stores.');
            return;
        }

        if (storeUsers.length === 1) {
            // Auto-select the only store
            await this.telegramService.setActiveStore(chatId, storeUsers[0].store_id);
            await ctx.reply(`✅ Active store set to: <b>${storeUsers[0].store?.name || storeUsers[0].store_id}</b>`, {
                parse_mode: 'HTML',
            });
            return;
        }

        // Multiple stores — show selection
        const buttons = storeUsers.map(su => {
            const isActive = su.store_id === account.active_store_id;
            const label = `${isActive ? '✅ ' : ''}${su.store?.name || su.store_id}`;
            return [Markup.button.callback(label, `select_store_${su.store_id}`)];
        });

        buttons.push([Markup.button.callback('◀️ Back to Menu', 'action_menu')]);

        await ctx.reply('🏪 <b>Select Active Store:</b>', {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(buttons),
        });
    }

    @Action(/^select_store_(.+)$/)
    async onSelectStore(@Ctx() ctx: Context): Promise<void> {
        await ctx.answerCbQuery();
        if (!ctx.chat) return;
        const chatId = ctx.chat.id;
        const match = (ctx as any).match;
        const storeId = match?.[1];

        if (!storeId) return;

        const account = await this.telegramService.setActiveStore(chatId, storeId);
        if (account) {
            // Get the store name
            const storeUsers = await this.telegramService.getUserStores(account.user_id);
            const selectedStore = storeUsers.find(su => su.store_id === storeId);
            await ctx.reply(
                `✅ Active store set to: <b>${selectedStore?.store?.name || storeId}</b>`,
                { parse_mode: 'HTML' },
            );
        }
    }

    // ── Back to Menu ─────────────────────────────────────────────────────

    @Action('action_menu')
    async onBackToMenu(@Ctx() ctx: Context): Promise<void> {
        await ctx.answerCbQuery();
        await this.onMenu(ctx);
    }

    // ── /help ────────────────────────────────────────────────────────────

    @Help()
    async onHelp(@Ctx() ctx: Context): Promise<void> {
        await ctx.reply(
            `ℹ️ <b>FloraPos Bot Help</b>\n\n` +
            `<b>Commands:</b>\n` +
            `/start — Link your account\n` +
            `/menu — Show main menu\n` +
            `/settings — Notification preferences\n` +
            `/help — Show this help\n\n` +
            `<b>Features:</b>\n` +
            `📊 View today's sales summary\n` +
            `🏪 Switch between your stores\n` +
            `⚙️ Toggle notification types\n` +
            `🧾 Receive new order alerts\n` +
            `📋 Daily sales summary (8 PM)\n`,
            { parse_mode: 'HTML' },
        );
    }
}
