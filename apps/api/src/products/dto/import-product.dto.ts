import { IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportProductDto {
    @ApiProperty({ description: 'The ID of the store to import FROM' })
    @IsUUID()
    source_store_id: string;

    @ApiProperty({ description: 'List of Product IDs to import', type: [String] })
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('4', { each: true })
    product_ids: string[];
}
