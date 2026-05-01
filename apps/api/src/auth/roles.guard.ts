import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Safety check if user is not authenticated yet
    if (!user) {
        console.log('RolesGuard: No user found in request. Headers:', JSON.stringify(request.headers));
        return false;
    }

    const userRole = user.role;
    if (!userRole) {
        console.log('RolesGuard: User found but NO role property. User:', JSON.stringify(user));
        return false;
    }

    const userRoleStr = String(userRole).toLowerCase();
    const hasRole = requiredRoles.some(role => role.toLowerCase() === userRoleStr);
    
    if (!hasRole) {
        console.log(`RolesGuard: Access denied. Required: [${requiredRoles}], User Role: ${userRole}`);
    }
    return hasRole;
  }
}
