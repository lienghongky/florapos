import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterService } from './master.service';
import { MasterController } from './master.controller';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { StoreUser } from '../stores/entities/store-user.entity';
import { SaaSPayment } from './entities/saas-payment.entity';
import { TelegramAccount } from '../telegram/entities/telegram-account.entity';
import { SystemSetting } from './entities/system-setting.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Store, StoreUser, SaaSPayment, TelegramAccount, SystemSetting]),
    ],
    controllers: [MasterController],
    providers: [MasterService],
    exports: [MasterService],
})
export class MasterModule { }
