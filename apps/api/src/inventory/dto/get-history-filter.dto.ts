import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InventoryActionType } from '../entities/inventory-history.entity';

export class GetHistoryFilterDto {
    @ApiProperty({ enum: InventoryActionType, required: false })
    @IsOptional()
    @IsEnum(InventoryActionType)
    action_type?: InventoryActionType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string; // Search by reference_id, user name, or notes

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    user_id?: string;
}
