import { Injectable, NestMiddleware, ConflictException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../users/users.service';
import { Role } from '../users/schemas/user.schema';

@Injectable()
export class AdminRegistrationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AdminRegistrationMiddleware.name);

  constructor(private usersService: UsersService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    
    if (req.method === 'POST' && req.url.includes('/register')) {
      const { role } = req.body;
      
      if (role === Role.ADMIN) {
        this.logger.log('Admin registration attempt detected - checking existing admin count');
        
        try {
          const adminCount = await this.usersService.countByRole(Role.ADMIN);
          
          if (adminCount > 0) {
            this.logger.warn('Admin registration blocked - admin already exists');
            throw new ConflictException('An admin user already exists. Only one admin is allowed in the system.');
          }
          
          this.logger.log('Admin registration allowed - no existing admin found');
        } catch (error) {
          if (error instanceof ConflictException) {
            throw error;
          }
          this.logger.error('Error checking admin count', error.stack);
          throw error;
        }
      }
    }
    
    next();
  }
} 