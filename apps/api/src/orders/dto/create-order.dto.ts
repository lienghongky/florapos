import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsArray, ValidateNested, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OrderType } from '../entities/order.entity';

class OrderItemAddonDto {
    @ApiProperty()
    @IsString()
    name_snapshot: string;
    
    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    addon_id?: string;
}

export class CreateOrderItemDto {
    @ApiProperty()
    @IsUUID()
    product_id: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    variant_id?: string;

    @ApiProperty()
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemAddonDto)
    addons?: OrderItemAddonDto[];
}

export class CreateOrderDto {
    @ApiProperty()
    @IsUUID()
    store_id: string;

    @ApiProperty({ enum: OrderType })
    @IsEnum(OrderType)
    order_type: OrderType;

    @ApiProperty({ type: [CreateOrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    customer_id?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    staff_id?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    session_id?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    delivery_fee?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    delivery_address?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    discount_amount?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    discount_code?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    payment_method?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    customer_name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    customer_phone?: string;
}
