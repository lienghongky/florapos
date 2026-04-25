import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType, PaymentMethod } from '../entities/transaction.entity';

export class CreateTransactionDto {
    @ApiProperty()
    @IsUUID()
    store_id: string;

    @ApiProperty()
    @IsUUID()
    category_id: string;

    @ApiProperty({ enum: TransactionType })
    @IsEnum(TransactionType)
    type: TransactionType;

    @ApiProperty()
    @IsNumber()
    amount: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsDateString()
    transaction_date: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    reference_number?: string;

    @ApiProperty({ enum: PaymentMethod, required: false })
    @IsOptional()
    @IsEnum(PaymentMethod)
    payment_method?: PaymentMethod;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}
