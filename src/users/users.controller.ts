import { Controller, Get, Query, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { SessionsService } from '../sessions/sessions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FilterDateDto } from './dto/filter-date.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
  ) {}


  //i just made these function to test something on my part (not important )
  @Get('online')
  getOnline() {
    return this.usersService.findLoggedInUsers();
  }

  @Get('offline')
  getOffline() {
    return this.usersService.findOfflineUsers();
  }

  @Get('records')
  async getByDate(@Query() filter: FilterDateDto) {
    try {
      if (!filter.from || !filter.to) {
        throw new BadRequestException('Both from and to dates are required');
      }

      this.logger.log(`User records request received from ${filter.from} to ${filter.to}`);
      
      const fromDate = new Date(filter.from);
      const toDate = new Date(filter.to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD format');
      }

      if (fromDate > toDate) {
        throw new BadRequestException('From date must be before to date');
      }

      // Get all sessions
      const sessions = await this.sessionsService.getAllSessions();
      
      const result = {
        sessions,
        count: sessions.length,
        timestamp: new Date().toISOString()
      };

      this.logger.log(`Retrieved ${sessions.length} user sessions`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get user records from ${filter.from} to ${filter.to}`, error.stack);
      throw error;
    }
  }
}
