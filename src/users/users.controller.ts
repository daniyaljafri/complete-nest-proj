import { Controller, Get, Post, Body, Request, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { SessionsService } from '../sessions/sessions.service';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private usersService: UsersService, private sessionsService: SessionsService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginUserDto) {
    return this.usersService.login(loginDto);
  }

  @Post('logout')
  async logout(@Request() req) {
    return this.usersService.logout(req.user.userId, req.user.sessionId);
  }

  @Get('logged-in-users')
  async getLoggedInUsers() {
    return this.usersService.findLoggedInUsers();
  }

  @Get('my-sessions')
  async getMySessions(@Request() req) {
    return this.sessionsService.getSessionsForUser(req.user.userId);
  }
}
