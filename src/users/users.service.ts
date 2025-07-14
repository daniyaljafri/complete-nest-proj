import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, Role } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const userData = {
      ...dto,
      password: hashedPassword,
    };
    return this.userModel.create(userData);
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  findById(id: string) {
    return this.userModel.findById(id);
  }

  countByRole(role: Role) {
    return this.userModel.countDocuments({ role });
  }

  findOne(filter: any) {
    return this.userModel.findOne(filter);
  }

  findLoggedInUsers() {
    return this.userModel.find({ isLoggedIn: true });
  }

  findOfflineUsers() {
    return this.userModel.find({ isLoggedIn: false });
  }

  findLoginRecordsBetween(from: Date, to: Date) {
    return this.userModel.find({ loginTime: { $gte: from, $lte: to } });
  }

  // Check if there's already a supervisor logged in
  async findLoggedInSupervisor(): Promise<User | null> {
    return this.userModel.findOne({ 
      role: Role.SUPERVISOR, 
      isLoggedIn: true 
    });
  }

  // Logout all supervisors (used when a new supervisor logs in)
  async logoutAllSupervisors(): Promise<void> {
    const now = new Date();
    await this.userModel.updateMany(
      { role: Role.SUPERVISOR, isLoggedIn: true },
      { 
        isLoggedIn: false,
        logoutTime: now,
        lastLogoutTime: now
      }
    );
  }

  async markAsLoggedIn(userId: string) {
    const now = new Date();
    return this.userModel.findByIdAndUpdate(
      userId,
      { 
        isLoggedIn: true, 
        loginTime: now, 
        lastLoginTime: now 
      },
      { new: true }
    );
  }

  async markAsLoggedOut(userId: string) {
    const now = new Date();
    return this.userModel.findByIdAndUpdate(
      userId,
      { 
        isLoggedIn: false, 
        logoutTime: now, 
        lastLogoutTime: now 
      },
      { new: true }
    );
  }

  getLoginRecords(startDate: Date, endDate: Date) {
    return this.userModel.find({
      lastLoginTime: { $gte: startDate, $lte: endDate }
    });
  }
}
