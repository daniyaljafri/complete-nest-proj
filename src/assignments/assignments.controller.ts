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

  @Post('shift/:shiftId/available-officers')
  async findAvailableOfficers(@Param('shiftId') shiftId: string, @Body() dto: FindAvailableOfficersDto) {
    // all officers
    const allOfficers = await this.usersService.getAllOfficers();
    
    // Get busy officer IDs and shift details for the specified time range
    const { busyOfficerIds, shift } = await this.assignmentsService.findAvailableOfficers(shiftId, dto);
    
    // Filter 
    const availableOfficers = allOfficers.filter(officer => 
      !busyOfficerIds.includes(officer._id.toString())
    );
    
    return {
      shift: shift,
      assignmentTime: {
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
      })),
      busyOfficersList: busyOfficerIds
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

  // Removed the old route for assigned and unassigned officers
} 