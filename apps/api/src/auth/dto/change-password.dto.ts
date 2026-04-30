import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({ example: 'currentPassword123', description: 'The current password of the user' })
    @IsString()
    @IsNotEmpty()
    old_password: string;

    @ApiProperty({ example: 'newPassword123', description: 'The new password to set' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    new_password: string;
}
