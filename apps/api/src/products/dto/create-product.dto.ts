import { IsString, IsNotEmpty, IsNumber, IsUUID, IsEnum, IsOptional, ValidateNested, IsArray, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductType, PricingType } from '../entities/product.entity';

class RecipeItemDto {
    @ApiProperty()
    @Transform(({ value }) => value?.trim() === '' ? undefined : value)
    @IsUUID()
    inventory_item_id: string;

    @ApiProperty()
    @IsNumber()
    quantity_required: number;
}

class AddonDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    price?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    max_quantity?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    required?: boolean;
}

class VariantDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    price_modifier?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    cost_modifier?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    sku?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    barcode?: string;
}

export class CreateProductDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsUUID()
    store_id: string;

    @ApiProperty({ enum: ProductType })
    @IsEnum(ProductType)
    product_type: ProductType;

    @ApiProperty({ enum: PricingType, required: false })
    @IsOptional()
    @IsEnum(PricingType)
    pricing_type?: string;

    @ApiProperty()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    base_price: number;


    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => value ? parseFloat(value) : undefined)
    @IsNumber()
    cost_price?: number;


    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    image_url?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    category_id?: string;

    @ApiProperty({ type: [RecipeItemDto], required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value)
    @Type(() => RecipeItemDto)
    recipe?: RecipeItemDto[];


    @ApiProperty({ type: [AddonDto], required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value)
    @Type(() => AddonDto)
    addons?: AddonDto[];


    @ApiProperty({ type: [VariantDto], required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value)
    @Type(() => VariantDto)
    variants?: VariantDto[];

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    taxable?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    tax_rate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    track_inventory?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    allow_negative_stock?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    is_active?: boolean;
}
