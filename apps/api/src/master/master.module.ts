import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterService } from './master.service';
import { MasterController } from './master.controller';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { StoreUser } from '../stores/entities/store-user.entity';
import { SaaSPayment } from './entities/saas-payment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Store, StoreUser, SaaSPayment]),
    ],
    controllers: [MasterController],
    providers: [MasterService],
    exports: [MasterService],
})
export class MasterModule { }
