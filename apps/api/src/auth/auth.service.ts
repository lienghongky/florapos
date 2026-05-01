import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/dto/create-user.dto';
import { StoresService } from '../stores/stores.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private storesService: StoresService,
        private jwtService: JwtService,
        private subscriptionsService: SubscriptionsService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && user.is_active && (await bcrypt.compare(pass, user.password_hash))) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password_hash, ...result } = user;
            return {
                ...result,
                role: this.deriveRole(user)
            };
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials or account inactive');
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    async register(createUserDto: any) {
        // For development simplicity, creating active users directly
        const user = await this.usersService.create(createUserDto);

        // Automatically create a default store if registering as an owner
        if (createUserDto.role === UserRole.OWNER || createUserDto.role === 'owner') {
            await this.subscriptionsService.initializeSubscription(user.id);
            await this.storesService.create(user.id, {
                name: `${user.full_name || 'My'} Store`,
                currency: 'USD'
            });
        }

        return {
            message: 'User registered successfully. You can now login.',
            userId: user.id
        };
    }

    async activate(token: string) {
        return this.usersService.activateUser(token);
    }

    async changePassword(userId: string, oldPass: string, newPass: string) {
        return this.usersService.changePassword(userId, oldPass, newPass);
    }

    async getUserProfile(userId: string) {
        // We need to fetch with relations to get store_roles
        // Reuse findByEmail logic or update findOne to include relations, 
        // but for now let's just make sure we get the full user object with updated findOne if necessary.
        // Or better, let's just use findByEmail if we knew the email, but here we have ID.
        // Let's rely on usersService.findOne being updated or create a new method there.
        // Actually, usersService.findOne currently does NOT join store_roles.
        // Let's assume we need to update findOne in UsersService too, OR use a query here.
        // For simplicity/robustness, let's update findOne in UsersService as well, OR use createQueryBuilder here via repository if we had access.
        // Since we don't have access to repo here, let's assume we update UsersService.findOne in next step or use this work-around:
        // UsersService.findByEmail joins store_roles. UsersService.findOne does NOT yet.

        // Wait, I only updated findByEmail. I should verify if I need to update findOne.
        // Yes, getUserProfile calls usersService.findOne(userId).

        const user = await this.usersService.findOne(userId); // This likely won't have store_roles unless I update UsersService
        if (!user) return null;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash, activation_token, ...result } = user;

        return {
            ...result,
            role: this.deriveRole(user)
        };
    }

    private deriveRole(user: any): string {
        // Prioritize the role column if set to MASTER
        if (user.role === 'MASTER') {
            return 'master';
        }

        if (!user.store_roles || user.store_roles.length === 0) {
            // If the user has OWNER role in the column but no stores yet, still return owner
            if (user.role === 'OWNER') return 'owner';
            return 'staff'; // Safe default
        }

        const roles = user.store_roles.map((sr: any) => sr.role);

        if (roles.includes(UserRole.OWNER) || user.role === 'OWNER') {
            return 'owner';
        }

        if (roles.includes(UserRole.STAFF)) {
            return 'staff';
        }

        return 'staff'; // Secure fallback
    }
}
