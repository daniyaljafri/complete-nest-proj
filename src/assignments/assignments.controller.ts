import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
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