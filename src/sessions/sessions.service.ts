import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(@InjectModel(Session.name) private sessionModel: Model<SessionDocument>) {}

  
  async createLoginSession(userId: string | Types.ObjectId, loginTime: Date = new Date()): Promise<Session> {
    try {
      const session = await this.sessionModel.create({
        userId: new Types.ObjectId(userId),
        loginTime
      });
      return session;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create login session');
    }
  }

 
  async endSessionById(sessionId: string, logoutTime: Date = new Date()): Promise<Session | null> {
    try {
      const session = await this.sessionModel.findById(sessionId);
      if (!session) { 
        return null;
      }
      if (session.logoutTime) {
             return session;
      }

      session.logoutTime = logoutTime;
      await session.save();

      return session;
    } catch (error) {
      throw new InternalServerErrorException('Failed to end session');
    }
  }

  //find the most recent active session for user
  async endSession(userId: string | Types.ObjectId, logoutTime: Date = new Date()): Promise<Session | null> {
    try {
      const session = await this.sessionModel.findOne({ 
        userId: new Types.ObjectId(userId), 
        logoutTime: null 
      }).sort({ loginTime: -1 });

      if (!session) {
                return null;
      }
      session.logoutTime = logoutTime;
      await session.save();
      return session;
    } catch (error) {
          throw new InternalServerErrorException('Failed to end session');
    }
  }

  
  async getAllSessions(): Promise<Session[]> {
    try {
      this.logger.log('Getting all sessions for all users');
      const sessions = await this.sessionModel.find()
        .sort({ loginTime: -1 });
      return sessions;
    } catch (error) {
      throw new InternalServerErrorException('Failed to get all sessions');
    }
  }

 
  async getSessionsBetweenDates(startDate: string, endDate: string): Promise<Session[]> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // i Included the whole end date
      
      const sessions = await this.sessionModel.find({
        loginTime: { $gte: start, $lte: end }
      })
      .sort({ loginTime: -1 });
      return sessions;
    } catch (error) {
      throw new InternalServerErrorException('Failed to get sessions between dates');
    }
  }
} 