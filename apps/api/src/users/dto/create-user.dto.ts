import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
    MASTER = 'MASTER',
    OWNER = 'OWNER',
    MANAGER = 'MANAGER',
    STAFF = 'STAFF',
}

export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', minLength: 6 })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'John Doe', required: false })
    @IsString()
    @IsOptional()
    full_name?: string;

    @ApiProperty({ example: 'owner', enum: UserRole, default: UserRole.OWNER })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}
