import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateLinkDto {
    @ApiProperty({ description: 'Target user ID to generate Telegram link for (defaults to current user)', required: false })
    @IsUUID()
    @IsOptional()
    target_user_id?: string;
}
