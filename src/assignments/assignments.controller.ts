import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { FindAvailableOfficersDto } from './dto/find-available-officers.dto';
import { UsersService } from '../users/users.service';

@Controller('assignments')
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly usersService: UsersService // Inject UsersService
  ) {}

  @Post()
  async create(@Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.createAssignment(dto);
  }

  @Post('available-officers')
  async findAvailableOfficers(@Body() dto: FindAvailableOfficersDto) {
    // Get all officers
    const allOfficers = await this.usersService.getAllOfficers();
    
    // Get busy officer IDs for the specified time range
    const busyOfficerIds = await this.assignmentsService.findAvailableOfficers(dto);
    
    // Filter out busy officers to get available officers
    const availableOfficers = allOfficers.filter(officer => 
      !busyOfficerIds.includes(officer._id.toString())
    );
    
    return {
      timeRange: {
        fromTime: dto.fromTime,
        toTime: dto.toTime
      },
      totalOfficers: allOfficers.length,
      availableOfficers: availableOfficers.length,
      busyOfficers: busyOfficerIds.length,
      availableOfficersList: availableOfficers.map(officer => ({
        id: officer._id,
        email: officer.email,
        username: officer.username,
        role: officer.role,
        isLoggedIn: officer.isLoggedIn
      }))
    };
  }

  @Get('officer/:officerId')          
  async getForOfficer(@Param('officerId') officerId: string) {
    return this.assignmentsService.getAssignmentsForOfficer(officerId);
  }

  @Get('shift/:shiftId')
  async getForShift(@Param('shiftId') shiftId: string) {
    return this.assignmentsService.getAssignmentsForShift(shiftId);
  }

  @Get('shift/:shiftId/officers')
  async getAssignedAndUnassignedOfficers(@Param('shiftId') shiftId: string) {
    // all assignments for this shift
    const assignments = await this.assignmentsService.getAssignmentsForShift(shiftId);
    const officers = await this.usersService.getAllOfficers();
    const assignedOfficerIds = assignments.map(a => a.officerId.toString());
    const assignedOfficers = officers.filter(o => assignedOfficerIds.includes(o._id.toString()));
    const unassignedOfficers = officers.filter(o => !assignedOfficerIds.includes(o._id.toString()));
    return {
      assignedOfficers,
      unassignedOfficers
    };
  }
} 