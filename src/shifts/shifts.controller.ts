import { Controller, Post, Body, Get } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  async create(@Body() dto: CreateShiftDto) {
    return this.shiftsService.createShift(dto);
  }

  @Get()
  async getAll() {
    return this.shiftsService.getAllShifts();
  }
} 