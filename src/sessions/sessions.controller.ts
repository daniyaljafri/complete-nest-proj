import { Controller, Get, InternalServerErrorException, Logger, Query } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(private readonly sessionsService: SessionsService) {}

  @Get('all')
  async getAllSessions() {
    try {
      this.logger.log('Getting all sessions for all users');
      const sessions = await this.sessionsService.getAllSessions();
      
      return {
        total: sessions.length,
        sessions: sessions.map(session => ({
          sessionId: (session as any)._id,
          userEmail: (session.userId as any)?.email || 'Unknown',
          userName: (session.userId as any)?.username || 'Unknown',
          loginTime: session.loginTime,
          logoutTime: session.logoutTime || null
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get all sessions', error.stack);
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

      this.logger.log('Getting sessions between dates');
      const sessions = await this.sessionsService.getSessionsBetweenDates(startDate, endDate);
      
      return {
        total: sessions.length,
        startDate,
        endDate,
        sessions: sessions.map(session => ({
          sessionId: (session as any)._id,
          userEmail: (session.userId as any)?.email || 'Unknown',
          userName: (session.userId as any)?.username || 'Unknown',
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