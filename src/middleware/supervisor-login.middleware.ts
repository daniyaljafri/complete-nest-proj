import { Injectable, NestMiddleware, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../users/users.service';
import { Role } from '../users/schemas/user.schema';

@Injectable()
export class SupervisorLoginMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SupervisorLoginMiddleware.name);

  constructor(private usersService: UsersService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only apply this middleware to login routes
    if (req.method === 'POST' && req.url.includes('/login')) {
      const { email } = req.body;
      
      if (email) {
        try {
          const user = await this.usersService.findByEmail(email);
          
          if (user && user.role === Role.SUPERVISOR) {
            this.logger.log('Supervisor login attempt detected - checking existing supervisor sessions');
            
            // Get all logged in users and filter for supervisors
            const loggedInUsers = await this.usersService.findLoggedInUsers();
            const loggedInSupervisors = loggedInUsers.filter(u => u.role === Role.SUPERVISOR);
            
            // Check if another supervisor is already logged in
            const otherLoggedInSupervisor = loggedInSupervisors.find(sup => sup.email !== user.email);
            
            if (otherLoggedInSupervisor) {
              this.logger.warn(`Supervisor login blocked - another supervisor already logged in: ${otherLoggedInSupervisor.email}`);
              throw new ConflictException(`Another supervisor (${otherLoggedInSupervisor.username || otherLoggedInSupervisor.email}) is already logged in. Only one supervisor can be logged in at a time.`);
            }
            
            this.logger.log('Supervisor login allowed - no conflicting supervisor session found');
          }
        } catch (error) {
          if (error instanceof ConflictException) {
            throw error;
          }
          if (error instanceof NotFoundException) {
            // User doesn't exist, which is fine for login attempts
            this.logger.log(`User not found during login attempt: ${email}`);
          } else {
            this.logger.error('Error checking supervisor login status', error.stack);
          }
        }
      }
    }
    
    next();
  }
} 