import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order.entity';
import { PaymentStatus } from '../entities/payment.entity';

export class UpdateOrderStatusDto {
    @ApiProperty({ enum: OrderStatus })
    @IsEnum(OrderStatus)
    status: OrderStatus;
}

export class UpdatePaymentStatusDto {
    @ApiProperty({ enum: PaymentStatus })
    @IsEnum(PaymentStatus)
    payment_status: PaymentStatus;

    @ApiProperty({ required: false })
    payment_method?: string;
}
