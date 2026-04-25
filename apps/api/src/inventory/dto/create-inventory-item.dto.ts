import { IsString, IsNotEmpty, IsNumber, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInventoryItemDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsUUID()
    store_id: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    sku?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    barcode?: string;

    @ApiProperty({ default: 0 })
    @IsNumber()
    current_stock: number;

    @ApiProperty({ default: 0 })
    @IsNumber()
    min_stock_threshold: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    unit_id?: string;

    @ApiProperty({ default: 0 })
    @IsNumber()
    cost_price: number;
}
