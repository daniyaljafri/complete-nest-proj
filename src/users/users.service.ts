import { 
  Injectable, 
  InternalServerErrorException, 
  BadRequestException, 
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, Role } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

      const result = await this.create(createUserDto);
      this.logger.log(`User registered successfully: ${createUserDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Registration failed for email: ${createUserDto?.email || 'unknown'}`, error.stack);
 
      if (error instanceof BadRequestException || 
          error instanceof ConflictException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async login(loginDto: LoginUserDto) {
    try {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);
      const user = await this.findByEmail(loginDto.email);
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.markAsLoggedIn(user._id);

      const loginTime = new Date();
      const session = await this.sessionsService.createLoginSession(user._id, loginTime);

      const payload = { 
        sub: user._id, 
        email: user.email, 
        role: user.role,
        sessionId: (session as any)._id
      };
      
      const token = this.jwtService.sign(payload);

      this.logger.log(`Login successful for user: ${loginDto.email}`);
      return {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          isLoggedIn: true,
        },
        access_token: token,
        sessionId: (session as any)._id,
        loginTime
      };
    } catch (error) {
      this.logger.error(`Login failed for email: ${loginDto?.email || 'unknown'}`, error.stack);
      
      if (error instanceof UnauthorizedException || 
          error instanceof NotFoundException ||
          error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Login failed');
    }
  }

  async logout(userId: string, sessionId?: string) {
    try {
      this.logger.log(`Logout attempt for user: ${userId}`);
      
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      await this.markAsLoggedOut(userId);

      let result = null;
      if (sessionId) {
        result = await this.sessionsService.endSessionById(sessionId);
        this.logger.log(`Session ${sessionId} ended for user: ${userId}`);
      } else {
        result = await this.sessionsService.endSession(userId);
        this.logger.log(`Latest session ended for user: ${userId}`);
      }

      this.logger.log(`Logout successful for user: ${userId}`);
      return {
        message: 'Logout successful',
        userId,
        sessionId,
        logoutTime: new Date()
      };
    } catch (error) {
      this.logger.error(`Logout failed for user: ${userId || 'unknown'}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Logout failed');
    }
  }

  async create(dto: CreateUserDto): Promise<User> {
    try {
      if (!dto.email || !dto.password || !dto.username) {
        throw new BadRequestException('Email, password, and username are required');
      }

      const existingUser = await this.userModel.findOne({ email: dto.email });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const newUser = new this.userModel({
        ...dto,
        password: hashedPassword,
        isLoggedIn: false,
      });

      const savedUser = await newUser.save();
      this.logger.log(`User created successfully: ${dto.email}`);
      
      const { password, ...userWithoutPassword } = savedUser.toObject();
      return userWithoutPassword as any;
    } catch (error) {
      this.logger.error(`Failed to create user: ${dto?.email || 'unknown'}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      
      if (error.code === 11000) {
        throw new ConflictException('User with this email already exists');
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
      const user = await this.userModel.findOne({ email });
      
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user by email: ${email || 'unknown'}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
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
      const user = await this.userModel.findById(id).select('-password');
      
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

  async findLoggedInUsers() {
    try {
      this.logger.log('Finding all logged-in users');
      return await this.userModel.find({ isLoggedIn: true }).select('-password');
    } catch (error) {
      this.logger.error('Failed to find logged-in users', error.stack);
      throw new InternalServerErrorException('Failed to retrieve logged-in users');
    }
  }

  async markAsLoggedIn(userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      this.logger.log(`Marking user as logged in: ${userId}`);
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { isLoggedIn: true },
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
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { isLoggedIn: false },
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
}
