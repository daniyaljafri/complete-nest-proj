import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Role } from '../users/schemas/user.schema';

@Injectable()
export class RolesMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RolesMiddleware.name);

  
  // Define route-role mapping
  private readonly routeRoles = {
    '/users/logged-in-users': [Role.ADMIN],
    '/sessions/all': [Role.ADMIN],
    '/sessions/dates': [Role.ADMIN],
  };

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Skip if no user 
      if (!req.user) {
        return next();
      }

      // Check if route with specific roles
      const requiredRoles = this.routeRoles[req.path];
      
      if (requiredRoles && !requiredRoles.includes(req.user.role)) {
        this.logger.warn(`Access denied for user ${req.user.email} to ${req.path}. Required roles: ${requiredRoles.join(', ')}, User role: ${req.user.role}`);
        throw new ForbiddenException('Insufficient permissions');
      }

      this.logger.log(`Role check passed for user: ${req.user.email}, role: ${req.user.role}, path: ${req.path}`);
      next();
    } catch (error) {
      this.logger.error(`Role check failed: ${error.message}`);
      throw error;
    }
  }
} 