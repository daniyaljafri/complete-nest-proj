import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Shift, ShiftDocument } from './shift.schema';
import { CreateShiftDto } from './dto/create-shift.dto';

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(
    @InjectModel(Shift.name) private shiftModel: Model<ShiftDocument>
  ) {}

  async createShift(dto: CreateShiftDto): Promise<Shift> {
    try {
      const shift = new this.shiftModel({
        name: dto.name,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      });
      return await shift.save();
    } catch (error) {
      this.logger.error('Failed to create shift', error.stack);
      throw new InternalServerErrorException('Failed to create shift');
    }
  }

  async getAllShifts(): Promise<Shift[]> {
    return this.shiftModel.find().sort({ startDate: 1 });
  }
} 