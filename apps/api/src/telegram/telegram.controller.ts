import { Controller, Post, Get, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TelegramService } from './telegram.service';
import { GenerateLinkDto } from './dto/generate-link.dto';
import { ConfigService } from '@nestjs/config';

/**
 * REST API for managing Telegram integration from the POS web dashboard.
 * All endpoints are JWT-protected.
 */
@ApiTags('telegram')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('telegram')
export class TelegramController {
    constructor(
        private readonly telegramService: TelegramService,
        private readonly configService: ConfigService,
    ) {}

    @Get('global-status')
    @ApiOperation({ summary: 'Check if Telegram linking is enabled globally' })
    async getGlobalStatus() {
        const enabled = await this.telegramService.isLinkingEnabled();
        return { enabled };
    }

    @Post('generate-link')
    @ApiOperation({ summary: 'Generate a Telegram invite link for account linking' })
    @ApiResponse({ status: 201, description: 'Returns the Telegram deep link URL' })
    async generateLink(@Request() req: any, @Body() dto: GenerateLinkDto) {
        const targetUserId = dto.target_user_id || req.user.userId;

        const token = await this.telegramService.generateLinkToken(targetUserId);
        const botUsername = await this.telegramService.getBotUsername();
        const link = `https://t.me/${botUsername}?start=${token}`;

        return {
            link,
            token,
            expires_in: '24 hours',
            bot_username: botUsername,
        };
    }

    @Get('status')
    @ApiOperation({ summary: 'Check if current user has a linked Telegram account' })
    @ApiResponse({ status: 200, description: 'Returns linking status and preferences' })
    async getStatus(@Request() req: any) {
        const account = await this.telegramService.findAccountByUserId(req.user.userId);
        const botUsername = await this.telegramService.getBotUsername();
        
        if (!account) {
            return {
                linked: false,
                bot_username: botUsername,
            };
        }

        return {
            linked: true,
            bot_username: botUsername,
            is_active: account.is_active,
            chat_id: account.chat_id,
            username: account.username,
            active_store_id: account.active_store_id,
            preferences: {
                notify_orders: account.notify_orders,
                notify_daily_summary: account.notify_daily_summary,
                notify_low_stock: account.notify_low_stock,
            },
            linked_at: account.created_at,
        };
    }

    @Delete('unlink')
    @ApiOperation({ summary: 'Unlink Telegram account from current user' })
    @ApiResponse({ status: 200, description: 'Account unlinked successfully' })
    async unlink(@Request() req: any) {
        await this.telegramService.unlinkAccount(req.user.userId);
        return { message: 'Telegram account unlinked successfully' };
    }
}
