import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

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
} 