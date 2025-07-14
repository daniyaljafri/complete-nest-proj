
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { Role } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    // Check if trying to register an admin
    if (createUserDto.role === Role.ADMIN) {
      const adminCount = await this.usersService.countByRole(Role.ADMIN);
      if (adminCount > 0) {
        throw new ConflictException('An admin user already exists. Only one admin is allowed in the system.');
      }
    }

    return this.usersService.create(createUserDto);
  }

  async login(loginDto: LoginUserDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is a supervisor and enforce single supervisor login rule
    if (user.role === Role.SUPERVISOR) {
      const loggedInSupervisor = await this.usersService.findLoggedInSupervisor();
      
      if (loggedInSupervisor && loggedInSupervisor.email !== user.email) {
        // Prevent login if another supervisor is already logged in
        throw new ConflictException(`Another supervisor (${loggedInSupervisor.username || loggedInSupervisor.email}) is already logged in. Only one supervisor can be logged in at a time.`);
      }
    }

    // Mark user as logged in
    await this.usersService.markAsLoggedIn(user._id);

    // Generate JWT token
    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async logout(userId: string) {
    return this.usersService.markAsLoggedOut(userId);
  }
}
