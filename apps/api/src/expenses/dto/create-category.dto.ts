import { IsString, IsNotEmpty, IsEnum, IsOptional, IsHexColor } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '../entities/expense-category.entity';

export class CreateCategoryDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ enum: CategoryType })
    @IsEnum(CategoryType)
    type: CategoryType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsHexColor()
    color?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    icon?: string;
}
