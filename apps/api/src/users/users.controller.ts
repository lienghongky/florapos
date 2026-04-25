import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateUserDto, UserRole as DtoRole } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

/**
 * Controller for managing users and staff accounts.
 * Primarily used by Owners to manage their shop staff.
 */
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({ status: 201, description: 'The user has been successfully created.' })
    @ApiResponse({ status: 409, description: 'Email already exists.' })
    async create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
        const creator = req.user;
        
        // Security: Only owners can create users
        if (creator.role !== 'owner') {
            throw new ForbiddenException('Only owners can manage staff accounts');
        }

        // Security: Owners cannot create other owners
        if (createUserDto.role === DtoRole.OWNER) {
            throw new ForbiddenException('You cannot create another owner account');
        }

        return this.usersService.create(createUserDto, creator.userId);
    }

    @Get()
    @ApiOperation({ summary: 'List all users' })
    async findAll(@Req() req: any, @Query('store_id') storeId?: string) {
        const requester = req.user;
        const ownerId = requester.role === 'master' ? undefined : requester.userId;
        
        const users = await this.usersService.findAll(ownerId, storeId);
        return users.map(user => {
            // Derive role for each user
            const role = this.deriveRole(user);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            return { ...user, role };
        });
    }

    private deriveRole(user: any): string {
        if (user.role === 'MASTER') return 'master';
        
        if (!user.store_roles || user.store_roles.length === 0) {
            if (user.role === 'OWNER') return 'owner';
            return 'staff'; // Safe default
        }
        const roles = user.store_roles.map((sr: any) => sr.role);
        if (roles.includes('OWNER') || user.role === 'OWNER') return 'owner';
        if (roles.includes('STAFF')) return 'staff';
        return 'staff';
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a user by ID' })
    @ApiResponse({ status: 200, description: 'Return the user.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a user' })
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Patch(':id/toggle-active')
    @ApiOperation({ summary: 'Toggle user active status' })
    toggleActive(@Param('id') id: string) {
        return this.usersService.toggleActive(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a user' })
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
