import { 
  Injectable, 
  InternalServerErrorException, 
  BadRequestException, 
  NotFoundException,
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, Role } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateUserDto): Promise<User> {
    try {
      this.logger.log(`Creating user with email: ${dto.email}`);

      // Input validation
      if (!dto.email || !dto.password) {
        throw new BadRequestException('Email and password are required');
      }

      if (dto.password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters long');
      }

      if (!dto.role || !Object.values(Role).includes(dto.role)) {
        throw new BadRequestException('Valid role is required');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const userData = {
        ...dto,
        password: hashedPassword,
      };

      const newUser = await this.userModel.create(userData);
      this.logger.log(`User created successfully: ${newUser.email}`);
      
      return newUser;
    } catch (error) {
      this.logger.error(`Failed to create user with email: ${dto?.email || 'unknown'}`, error.stack);
      
      // Re-throw validation errors
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle duplicate email error
      if (error.code === 11000) {
        throw new BadRequestException('Email already exists');
      }
      
      // Handle bcrypt errors
      if (error.message && error.message.includes('bcrypt')) {
        throw new InternalServerErrorException('Password hashing failed');
      }
      
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findByEmail(email: string) {
    try {
      if (!email) {
        throw new BadRequestException('Email is required');
      }

      this.logger.log(`Finding user by email: ${email}`);
      return await this.userModel.findOne({ email });
    } catch (error) {
      this.logger.error(`Failed to find user by email: ${email || 'unknown'}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to find user by email');
    }
  }

  async findById(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('User ID is required');
      }

      this.logger.log(`Finding user by ID: ${id}`);
      const user = await this.userModel.findById(id);
      
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user by ID: ${id || 'unknown'}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid user ID format');
      }
      
      throw new InternalServerErrorException('Failed to find user by ID');
    }
  }

  async countByRole(role: Role) {
    try {
      if (!role || !Object.values(Role).includes(role)) {
        throw new BadRequestException('Valid role is required');
      }

      this.logger.log(`Counting users with role: ${role}`);
      return await this.userModel.countDocuments({ role });
    } catch (error) {
      this.logger.error(`Failed to count users by role: ${role || 'unknown'}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to count users by role');
    }
  }

  async findOne(filter: any) {
    try {
      if (!filter || Object.keys(filter).length === 0) {
        throw new BadRequestException('Search filter is required');
      }

      this.logger.log(`Finding user with filter: ${JSON.stringify(filter)}`);
      return await this.userModel.findOne(filter);
    } catch (error) {
      this.logger.error(`Failed to find user with filter`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  async findLoggedInUsers() {
    try {
      this.logger.log('Finding all logged-in users');
      return await this.userModel.find({ isLoggedIn: true }).select('-password');
    } catch (error) {
      this.logger.error('Failed to find logged-in users', error.stack);
      throw new InternalServerErrorException('Failed to retrieve logged-in users');
    }
  }

  async findOfflineUsers() {
    try {
      this.logger.log('Finding all offline users');
      return await this.userModel.find({ isLoggedIn: false }).select('-password');
    } catch (error) {
      this.logger.error('Failed to find offline users', error.stack);
      throw new InternalServerErrorException('Failed to retrieve offline users');
    }
  }

  async findLoginRecordsBetween(from: Date, to: Date) {
    try {
      if (!from || !to) {
        throw new BadRequestException('Start date and end date are required');
      }

      if (from > to) {
        throw new BadRequestException('Start date must be before end date');
      }

      this.logger.log(`Finding login records between ${from.toISOString()} and ${to.toISOString()}`);
      return await this.userModel.find({ 
        loginTime: { $gte: from, $lte: to } 
      }).select('-password');
    } catch (error) {
      this.logger.error('Failed to find login records between dates', error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to retrieve login records');
    }
  }

  // Check if there's already a supervisor logged in
  async findLoggedInSupervisor(): Promise<User | null> {
    try {
      this.logger.log('Finding logged-in supervisor');
      return await this.userModel.findOne({ 
        role: Role.SUPERVISOR, 
        isLoggedIn: true 
      });
    } catch (error) {
      this.logger.error('Failed to find logged-in supervisor', error.stack);
      throw new InternalServerErrorException('Failed to check supervisor status');
    }
  }

  //      for testing not using it now tho 
  // Logout all supervisors ( when a new supervisor logs in)
  async logoutAllSupervisors(): Promise<void> {
    try {
      this.logger.log('Logging out all supervisors');
      const now = new Date();
      await this.userModel.updateMany(
        { role: Role.SUPERVISOR, isLoggedIn: true },
        { 
          isLoggedIn: false,
          logoutTime: now,
          lastLogoutTime: now
        }
      );
      this.logger.log('All supervisors logged out successfully');
    } catch (error) {
      this.logger.error('Failed to logout all supervisors', error.stack);
      throw new InternalServerErrorException('Failed to logout supervisors');
    }
  }

  async markAsLoggedIn(userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      this.logger.log(`Marking user as logged in: ${userId}`);
      const now = new Date();
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { 
          isLoggedIn: true, 
          loginTime: now, 
          lastLoginTime: now 
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      this.logger.log(`User marked as logged in successfully: ${userId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to mark user as logged in: ${userId || 'unknown'}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid user ID format');
      }
      
      throw new InternalServerErrorException('Failed to update user login status');
    }
  }

  async markAsLoggedOut(userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      this.logger.log(`Marking user as logged out: ${userId}`);
      const now = new Date();
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { 
          isLoggedIn: false, 
          logoutTime: now, 
          lastLogoutTime: now 
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      this.logger.log(`User marked as logged out successfully: ${userId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to mark user as logged out: ${userId || 'unknown'}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid user ID format');
      }
      
      throw new InternalServerErrorException('Failed to update user logout status');
    }
  }

  async getLoginRecords(startDate: Date, endDate: Date) {
    try {
      if (!startDate || !endDate) {
        throw new BadRequestException('Start date and end date are required');
      }

      if (startDate > endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      this.logger.log(`Getting login records between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      return await this.userModel.find({
        lastLoginTime: { $gte: startDate, $lte: endDate }
      }).select('-password');
    } catch (error) {
      this.logger.error('Failed to get login records', error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to retrieve login records');
    }
  }
}
