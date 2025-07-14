
import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { Role } from '../users/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('login-history')
  async getLoginHistory(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    return {
      lastLoginTime: user.lastLoginTime,
      lastLogoutTime: user.lastLogoutTime,
    };
  }

  @Get('system-status')
  async getSystemStatus() {
    const adminCount = await this.usersService.countByRole(Role.ADMIN);
    const officerCount = await this.usersService.countByRole(Role.OFFICER);
    const supervisorCount = await this.usersService.countByRole(Role.SUPERVISOR);
    
    return {
      adminCount,
      officerCount,
      supervisorCount,
      canRegisterAdmin: adminCount === 0,
      message: adminCount === 0 ? 'No admin exists. Admin registration is allowed.' : 'Admin already exists. Admin registration is blocked.'
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('logged-in-supervisors')
  async getLoggedInSupervisors() {
    const supervisor = await this.usersService.findLoggedInSupervisor();
    return {
      loggedInSupervisor: supervisor,
      count: supervisor ? 1 : 0
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('logged-in-users')
  async getLoggedInUsers() {
    return this.usersService.findLoggedInUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('offline-users')
  async getOfflineUsers() {
    return this.usersService.findOfflineUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('login-records')
  async getLoginRecords(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.usersService.getLoginRecords(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
