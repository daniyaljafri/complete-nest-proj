import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(@InjectModel(Session.name) private sessionModel: Model<SessionDocument>) {}

  /**
   * Create a login session
   */
  async createLoginSession(userId: string | Types.ObjectId, loginTime: Date = new Date()): Promise<Session> {
    try {
      const session = await this.sessionModel.create({
        userId: new Types.ObjectId(userId),
        loginTime
      });
      
      this.logger.log(`Login session created: ${(session as any)._id}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create login session for user: ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to create login session');
    }
  }

  /**
   * End a specific session by session ID
   */
  async endSessionById(sessionId: string, logoutTime: Date = new Date()): Promise<Session | null> {
    try {
      const session = await this.sessionModel.findById(sessionId);

      if (!session) {
        this.logger.warn(`Session not found: ${sessionId}`);
        return null;
      }

      if (session.logoutTime) {
        this.logger.warn(`Session already logged out: ${sessionId}`);
        return session;
      }

      session.logoutTime = logoutTime;
      await session.save();

      this.logger.log(`Session ended: ${sessionId}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to end session: ${sessionId}`, error.stack);
      throw new InternalServerErrorException('Failed to end session');
    }
  }

  /**
   * End a session (logout) - finds most recent active session for user
   */
  async endSession(userId: string | Types.ObjectId, logoutTime: Date = new Date()): Promise<Session | null> {
    try {
      const session = await this.sessionModel.findOne({ 
        userId: new Types.ObjectId(userId), 
        logoutTime: null 
      }).sort({ loginTime: -1 });

      if (!session) {
        this.logger.warn(`No active session found for user: ${userId}`);
        return null;
      }

      session.logoutTime = logoutTime;
      await session.save();

      this.logger.log(`Session ended: ${session._id}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to end session for user: ${userId}`, error.stack);
      throw new InternalServerErrorException('Failed to end session');
    }
  }

  /**
   * Get ALL sessions for ALL users (simple)
   */
  async getAllSessions(): Promise<Session[]> {
    try {
      this.logger.log('Getting all sessions for all users');
      const sessions = await this.sessionModel.find()
        .populate('userId', 'email username role')
        .sort({ loginTime: -1 });
      
      this.logger.log(`Found ${sessions.length} total sessions`);
      return sessions;
    } catch (error) {
      this.logger.error('Failed to get all sessions', error.stack);
      throw new InternalServerErrorException('Failed to get all sessions');
    }
  }

  /**
   * Get sessions between specific dates (simple)
   */
  async getSessionsBetweenDates(startDate: string, endDate: string): Promise<Session[]> {
    try {
      this.logger.log(`Getting sessions between ${startDate} and ${endDate}`);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the whole end date
      
      const sessions = await this.sessionModel.find({
        loginTime: { $gte: start, $lte: end }
      })
      .populate('userId', 'email username role')
      .sort({ loginTime: -1 });
      
      this.logger.log(`Found ${sessions.length} sessions between dates`);
      return sessions;
    } catch (error) {
      this.logger.error('Failed to get sessions between dates', error.stack);
      throw new InternalServerErrorException('Failed to get sessions between dates');
    }
  }
} 