import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExchangeRateDto {
    @ApiProperty({ example: 'USD' })
    @IsString()
    from_currency: string;

    @ApiProperty({ example: 'KHR' })
    @IsString()
    to_currency: string;

    @ApiProperty({ example: 4100.00 })
    @IsNumber()
    rate: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    effective_from?: string;
}
