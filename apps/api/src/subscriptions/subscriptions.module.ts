import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionExpiryJob } from './jobs/subscription-expiry.job';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { StoreUser } from '../stores/entities/store-user.entity';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([
            Subscription, 
            SubscriptionPlan, 
            User, 
            Store, 
            StoreUser
        ]),
    ],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService, SubscriptionExpiryJob],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
