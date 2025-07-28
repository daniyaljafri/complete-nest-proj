import { Injectable, InternalServerErrorException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from './assignment.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { FindAvailableOfficersDto } from './dto/find-available-officers.dto';
import { ShiftsService } from '../shifts/shifts.service';
import { ShiftDocument } from '../shifts/shift.schema';

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
    private shiftsService: ShiftsService
  ) {}

  async createAssignment(dto: CreateAssignmentDto): Promise<Assignment> {
    try {
      const fromTime = new Date(dto.fromTime);
      const toTime = new Date(dto.toTime);
      const officerId = new Types.ObjectId(dto.officerId);

      // now chk for same officer, overlapping date range,daysOfWeek, time-of-day
      const overlapQuery: any = {
        officerId,
        fromTime: { $lt: toTime },
        toTime: { $gt: fromTime },
      };
      if (dto.daysOfWeek && dto.daysOfWeek.length > 0) {
        overlapQuery.daysOfWeek = { $in: dto.daysOfWeek };
      }
      // we can find all potential ovrrlaps before hand 
      const overlaps = await this.assignmentModel.find(overlapQuery);
      // Chk for actual time-of-day overlap on the same day
      const newFrom = new Date(dto.fromTime);
      const newTo = new Date(dto.toTime);
      const newStartMinutes = newFrom.getUTCHours() * 60 + newFrom.getUTCMinutes();
      const newEndMinutes = newTo.getUTCHours() * 60 + newTo.getUTCMinutes();
      for (const overlap of overlaps) {
        // Only chk days that actually overlap
        if (dto.daysOfWeek && overlap.daysOfWeek) {
          const commonDays = dto.daysOfWeek.filter(day => overlap.daysOfWeek.includes(day));
          if (commonDays.length === 0) continue;
        }
        // Compare time-of-day overlap
        const overlapFrom = new Date(overlap.fromTime);
        const overlapTo = new Date(overlap.toTime);
        const overlapStartMinutes = overlapFrom.getUTCHours() * 60 + overlapFrom.getUTCMinutes();
        const overlapEndMinutes = overlapTo.getUTCHours() * 60 + overlapTo.getUTCMinutes();
       
        if (newStartMinutes < overlapEndMinutes && newEndMinutes > overlapStartMinutes) {
          throw new Error('Officer already assigned during this time and day.');
        }
      }

      const assignment = new this.assignmentModel({
        officerId,
        shiftId: new Types.ObjectId(dto.shiftId),
        fromTime,
        toTime,
        daysOfWeek: dto.daysOfWeek,
      });
      return await assignment.save();
    } catch (error) {
      this.logger.error('Failed to create assignment', error.stack);
      throw new InternalServerErrorException(error.message || 'Failed to create assignment');
    }
  }

  async findAvailableOfficers(shiftId: string, dto: FindAvailableOfficersDto): Promise<{ busyOfficerIds: string[], shift: any }> {
    try {
      // we can First, get shift details hehe
      const allShifts = await this.shiftsService.getAllShifts();
      const shift = allShifts.find(s => (s as ShiftDocument)._id.toString() === shiftId);
      
      if (!shift) {
        throw new NotFoundException('Shift not found');
      }

      const assignmentFromTime = new Date(dto.fromTime);
      const assignmentToTime = new Date(dto.toTime);
      const shiftStartDate = new Date(shift.startDate);
      const shiftEndDate = new Date(shift.endDate);

      // then validatethat assignment 
      if (assignmentFromTime < shiftStartDate || assignmentToTime > shiftEndDate) {
        throw new BadRequestException(
          `Assignment time (${assignmentFromTime.toISOString()} - ${assignmentToTime.toISOString()}) ` +
          `must fall within shift time (${shiftStartDate.toISOString()} - ${shiftEndDate.toISOString()})`
        );
      }

      
      const overlapQuery = {
        fromTime: { $lt: assignmentToTime },
        toTime: { $gt: assignmentFromTime },
      };
      
      const conflictingAssignments = await this.assignmentModel.find(overlapQuery);
      
      // Extract officer IDs that have conflicting assignments and remove duplicates using Set
      const busyOfficerIdsSet = new Set<string>();
      conflictingAssignments.forEach(assignment => {
        busyOfficerIdsSet.add(assignment.officerId.toString());
      });
      
      const busyOfficerIds = Array.from(busyOfficerIdsSet);
      
      return {
        busyOfficerIds,
        shift: {
          id: (shift as ShiftDocument)._id,
          name: shift.name,
          description: shift.description,
          startDate: shift.startDate,
          endDate: shift.endDate
        }
      };
    } catch (error) {
      this.logger.error('Failed to find available officers', error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to find available officers');
    }
  }

  async getAssignmentsForOfficer(officerId: string): Promise<Assignment[]> {
    return this.assignmentModel.find({ officerId: new Types.ObjectId(officerId) }).sort({ fromTime: 1 });
  }

  async getAssignmentsForShift(shiftId: string): Promise<Assignment[]> {
    return this.assignmentModel.find({ shiftId: new Types.ObjectId(shiftId) }).sort({ fromTime: 1 });
  }
} 