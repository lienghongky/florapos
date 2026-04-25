import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Controller for authentication and user registration.
 * Handles login, registration, profile retrieval, and account activation.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Return JWT access token' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    signIn(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Return user profile' })
    async getProfile(@Request() req: any) {
        // req.user contains { userId, email, role } from JwtStrategy
        const user = await this.authService.getUserProfile(req.user.userId);
        return user;
    }

    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    @ApiResponse({ status: 201, description: 'User registered' })
    register(@Body() createUserDto: any) { // using any for now, ideally create specific DTO
        return this.authService.register(createUserDto);
    }

    @Get('activate')
    @ApiOperation({ summary: 'Activate account' })
    @ApiResponse({ status: 200, description: 'Account activated' })
    activate(@Query('token') token: string) {
        return this.authService.activate(token);
    }
}
