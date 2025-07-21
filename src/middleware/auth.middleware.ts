import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private sessionsService: SessionsService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Skip authentication for public routes
      const publicRoutes = [
        '/users/register',
        '/users/login'
      ];

      if (publicRoutes.includes(req.path)) {
        return next();
      }

      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No token provided');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix


      const payload = this.jwtService.verify(token);

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

     
      req.user = {
        userId: payload.sub,
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        sessionId: payload.sessionId
      };

      const session = await this.sessionsService.findById(req.user.sessionId);
      if (!session || session.logoutTime) {
        throw new UnauthorizedException('Session has ended. Please log in again.');
      }

      this.logger.log(`Authenticated user: ${user.email}`);
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      
      throw new UnauthorizedException(error.message || 'Authentication failed');
    }
  }
} 