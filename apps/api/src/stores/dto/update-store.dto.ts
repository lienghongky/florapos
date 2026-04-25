import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateStoreDto } from './create-store.dto';

import { IsOptional, IsString } from 'class-validator';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
    @ApiProperty({ example: 'INV-', description: 'Prefix for invoice IDs', required: false })
    @IsString()
    @IsOptional()
    invoice_prefix?: string;
}
