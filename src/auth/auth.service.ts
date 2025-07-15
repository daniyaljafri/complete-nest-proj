
import { Injectable, UnauthorizedException, ConflictException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { Role } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private sessionsService: SessionsService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      this.logger.log(`Registration attempt for email: ${createUserDto.email}`);
      if (!createUserDto.email || !createUserDto.password) {
        throw new BadRequestException('Email and password are required');
      }
      if (!createUserDto.role || !Object.values(Role).includes(createUserDto.role)) {
        throw new BadRequestException('Valid role is required');
      }

      // for register an admin
      if (createUserDto.role === Role.ADMIN) {
        this.logger.log('Admin registration attempt - checking existing admin count');
        const adminCount = await this.usersService.countByRole(Role.ADMIN);
        if (adminCount > 0) {
          this.logger.warn('Admin registration rejected - admin already exists');
          throw new ConflictException('An admin user already exists. Only one admin is allowed in the system.');
        }
      }

      const result = await this.usersService.create(createUserDto);
      this.logger.log(`User registered successfully: ${createUserDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Registration failed for email: ${createUserDto?.email || 'unknown'}`, error.stack);
      
      // Re-throwing for known exceptions
      if (error instanceof BadRequestException || 
          error instanceof ConflictException) {
        throw error;
      }
      
      // service-level 
      if (error.message && error.message.includes('Email already exists')) {
        throw new ConflictException('Email already exists');
      }
      
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async login(loginDto: LoginUserDto) {
    try {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);

      if (!loginDto.email || !loginDto.password) {
        throw new BadRequestException('Email and password are required');
      }

      const user = await this.usersService.findByEmail(loginDto.email);
      if (!user) {
        this.logger.warn(`Login failed - user not found: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Login failed - invalid password: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.role === Role.SUPERVISOR) {
        this.logger.log('Supervisor login attempt - checking existing supervisor sessions');
        const loggedInSupervisor = await this.usersService.findLoggedInSupervisor();
        
        if (loggedInSupervisor && loggedInSupervisor.email !== user.email) {
          this.logger.warn(`Supervisor login rejected - another supervisor already logged in: ${loggedInSupervisor.email}`);
          throw new ConflictException(`Another supervisor (${loggedInSupervisor.username || loggedInSupervisor.email}) is already logged in. Only one supervisor can be logged in at a time.`);
        }
      }

      await this.usersService.markAsLoggedIn(user._id);

      // Create login session record
      const loginTime = new Date();
      const session = await this.sessionsService.createLoginSession(user._id, loginTime);

      // Generate JWT token with session ID
      const payload = { 
        sub: user._id, 
        email: user.email, 
        role: user.role,
        sessionId: (session as any)._id 
      };
      const accessToken = this.jwtService.sign(payload);

      this.logger.log(`Login successful for user: ${loginDto.email}`);
      
      return {
        access_token: accessToken,
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(`Login failed for email: ${loginDto?.email || 'unknown'}`, error.stack);

      if (error instanceof BadRequestException || 
          error instanceof UnauthorizedException || 
          error instanceof ConflictException) {
        throw error;
      }
      
      
      if (error.message && error.message.includes('bcrypt')) {
        throw new InternalServerErrorException('Password verification failed');
      }
      
      if (error.message && error.message.includes('jwt')) {
        throw new InternalServerErrorException('Token generation failed');
      }
      
      throw new InternalServerErrorException('Login failed');
    }
  }

  async logout(userId: string, sessionId?: string) {
    try {
      this.logger.log(`Logout attempt for user ID: ${userId}, session ID: ${sessionId}`);

      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const result = await this.usersService.markAsLoggedOut(userId);
      
      // End the specific session if sessionId provided, otherwise end most recent session
      if (sessionId) {
        await this.sessionsService.endSessionById(sessionId);
      } else {
        await this.sessionsService.endSession(userId);
      }
      
      this.logger.log(`Logout successful for user ID: ${userId}`);
      
      return result;
    } catch (error) {
      this.logger.error(`Logout failed for user ID: ${userId || 'unknown'}`, error.stack);
     
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      if (error.message && error.message.includes('User not found')) {
        throw new BadRequestException('User not found');
      }
      
      if (error.message && error.message.includes('Invalid user ID format')) {
        throw new BadRequestException('Invalid user ID format');
      }
      
      throw new InternalServerErrorException('Logout failed');
    }
  }
}
