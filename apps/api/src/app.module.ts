import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { ExpensesModule } from './expenses/expenses.module';
import { OrdersModule } from './orders/orders.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PriceTransformInterceptor } from './common/interceptors/price-transform.interceptor';
import { CategoriesModule } from './categories/categories.module';
import { MasterModule } from './master/master.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegramModule } from './telegram/telegram.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { EmenuModule } from './emenu/emenu.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DATABASE_USER') || configService.get<string>('DB_USER'),
        password: configService.get<string>('DATABASE_PASSWORD') || configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME') || configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Auto create tables (dev only)
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    StoresModule,
    ProductsModule,
    InventoryModule,
    ExchangeRatesModule,
    ExpensesModule,
    OrdersModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 120, // Increased from 10 to 120 to provide better UX
    }]),
    CategoriesModule,
    MasterModule,
    TelegramModule,
    SubscriptionsModule,
    EmenuModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PriceTransformInterceptor,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly appService: AppService) {}

  async onModuleInit() {
    await this.appService.seedMasterAccount();
  }
}
