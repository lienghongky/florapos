import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoreDto {
    @ApiProperty({ example: 'My Awesome Flower Shop', description: 'The name of the store' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'USD', description: 'The currency of the store', required: false, default: 'USD' })
    @IsString()
    @IsOptional()
    currency?: string;

    @ApiProperty({ example: '123 Main St, Anytown USA', description: 'The address of the store', required: false })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({ example: '+1-555-0123', description: 'The phone number of the store', required: false })
    @IsString()
    @IsOptional()
    phone_number?: string;

    @ApiProperty({ example: 'We sell the best flowers in town!', description: 'A description of the store', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: '/uploads/banner.jpg', description: 'The path to the store banner image', required: false })
    @IsString()
    @IsOptional()
    banner_image?: string;

    @ApiProperty({ example: '/uploads/logo.png', description: 'The path to the store logo image', required: false })
    @IsString()
    @IsOptional()
    logo_url?: string;

    @ApiProperty({ example: 'VAT-123456789', description: 'Tax ID or VAT number for receipts', required: false })
    @IsString()
    @IsOptional()
    tax_id?: string;

    @ApiProperty({ example: 'Thank you for your business!', description: 'Custom text for the receipt footer', required: false })
    @IsString()
    @IsOptional()
    receipt_footer_text?: string;

    @ApiProperty({ example: 'https://myshop.com', description: 'Website URL for the store', required: false })
    @IsString()
    @IsOptional()
    website?: string;

    @ApiProperty({ example: 'INV-', description: 'Prefix for invoice IDs', required: false })
    @IsString()
    @IsOptional()
    invoice_prefix?: string;
}
