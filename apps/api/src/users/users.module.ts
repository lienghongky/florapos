import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { StoreUser } from '../stores/entities/store-user.entity';
import { Order } from '../orders/entities/order.entity';
import { InventoryHistory } from '../inventory/entities/inventory-history.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, StoreUser, Order, InventoryHistory])],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
