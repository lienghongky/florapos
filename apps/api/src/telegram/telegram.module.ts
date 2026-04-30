import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramAccount } from './entities/telegram-account.entity';
import { TelegramLinkToken } from './entities/telegram-link-token.entity';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';
import { TelegramController } from './telegram.controller';
import { NotificationListener } from './notification.listener';
import { NotificationQueueService } from './notification-queue.service';
import { DailySummaryService } from './daily-summary.service';
import { StoreUser } from '../stores/entities/store-user.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TelegramAccount, TelegramLinkToken, StoreUser]),
        TelegrafModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const token = configService.get<string>('TELEGRAM_BOT_TOKEN');
                if (!token) {
                    Logger.warn(
                        'TELEGRAM_BOT_TOKEN not set — Telegram bot will not be initialized',
                        'TelegramModule',
                    );
                }
                const webhookUrl = configService.get<string>('TELEGRAM_WEBHOOK_URL');
                
                // If token is missing, we use a dummy but tell Telegraf NOT to launch
                const isDummy = !token;
                
                return {
                    token: token || 'DUMMY_TOKEN',
                    launchOptions: isDummy 
                        ? false // Do not attempt to connect if no token
                        : (webhookUrl
                            ? {
                                  webhook: {
                                      domain: webhookUrl,
                                      hookPath: '/api/telegram-webhook',
                                  },
                              }
                            : undefined),
                };
            },
            inject: [ConfigService],
        }),
        OrdersModule,
    ],
    controllers: [TelegramController],
    providers: [
        TelegramService,
        TelegramUpdate,
        NotificationListener,
        NotificationQueueService,
        DailySummaryService,
    ],
    exports: [TelegramService],
})
export class TelegramModule implements OnModuleInit {
    private readonly logger = new Logger(TelegramModule.name);

    constructor(private readonly configService: ConfigService) {}

    onModuleInit() {
        const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
        if (token) {
            const webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL');
            if (webhookUrl) {
                this.logger.log(`Telegram bot initialized in WEBHOOK mode → ${webhookUrl}/api/telegram-webhook`);
            } else {
                this.logger.log('Telegram bot initialized in LONG-POLLING mode (dev)');
            }
        } else {
            this.logger.warn('Telegram bot SKIPPED — set TELEGRAM_BOT_TOKEN in .env to enable');
        }
    }
}
