import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({ description: 'The UUID of the store this category belongs to' })
    @IsUUID()
    @IsNotEmpty()
    store_id: string;

    @ApiProperty({ description: 'The name of the category' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'A description of the category' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Hex color code for the category UI (e.g., #FFFFFF)' })
    @IsString()
    @IsOptional()
    @Length(7, 7)
    @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex code starting with #' })
    color?: string;

    @ApiPropertyOptional({ description: 'The display order of the category' })
    @IsNumber()
    @IsOptional()
    display_order?: number;

    @ApiPropertyOptional({ description: 'Whether the category is active' })
    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
