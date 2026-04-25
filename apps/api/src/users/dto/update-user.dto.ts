import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from './create-user.dto';

export class UpdateUserDto {
    @ApiProperty({ example: 'user@example.com', required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ example: 'password123', minLength: 6, required: false })
    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;

    @ApiProperty({ example: 'John Doe', required: false })
    @IsString()
    @IsOptional()
    full_name?: string;

    @ApiProperty({ example: 'owner', enum: UserRole, required: false })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}
