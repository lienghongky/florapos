import { IsNumber, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AdjustmentType {
    INCREASE = 'increase',
    DECREASE = 'decrease',
    SET = 'set', // Set to exact value
}

export class UpdateStockDto {
    @ApiProperty()
    @IsNumber()
    quantity: number;

    @ApiProperty({ enum: AdjustmentType })
    @IsEnum(AdjustmentType)
    type: AdjustmentType;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    reason: string;
}
