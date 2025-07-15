import { Controller, Get, InternalServerErrorException, Logger, Query } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(private readonly sessionsService: SessionsService) {}

  @Get('all')
  async getAllSessions() {
    try {
      const sessions = await this.sessionsService.getAllSessions();
      
      return {
        total: sessions.length,
        sessions: sessions.map(session => ({
          sessionId: (session as any)._id,
          
          loginTime: session.loginTime,
          logoutTime: session.logoutTime || null
        }))
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to get sessions');
    }
  }

  @Get('dates')
  async getSessionsBetweenDates(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    try {
      if (!startDate || !endDate) {
        throw new InternalServerErrorException('startDate and endDate are required');
      }
      const sessions = await this.sessionsService.getSessionsBetweenDates(startDate, endDate);
      return {
        total: sessions.length,
        startDate,
        endDate,
        sessions: sessions.map(session => ({
          sessionId: (session as any)._id,
        
          loginTime: session.loginTime,
          logoutTime: session.logoutTime || null
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get sessions between dates', error.stack);
      throw new InternalServerErrorException('Failed to get sessions between dates');
    }
  }
} 