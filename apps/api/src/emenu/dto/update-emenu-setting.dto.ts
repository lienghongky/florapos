import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmenuSettingDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    is_enabled?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    show_prices?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    allow_ordering?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    banner_image?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    theme_color?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    template_id?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    require_customer_name?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    require_customer_phone?: boolean;

    @ApiProperty({ required: false, type: [String] })
    @IsOptional()
    qr_tags?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    social_links?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        tiktok?: string;
        website?: string;
    };

    @ApiProperty({ required: false, type: [String] })
    @IsOptional()
    phone_numbers?: string[];
}
