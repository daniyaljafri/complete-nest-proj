import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FilterDateDto } from './dto/filter-date.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('online')
  getOnline() {
    return this.usersService.findLoggedInUsers();
  }

  @Get('offline')
  getOffline() {
    return this.usersService.findOfflineUsers();
  }

  @Get('records')
  getByDate(@Query() filter: FilterDateDto) {
    return this.usersService.findLoginRecordsBetween(
      new Date(filter.from),
      new Date(filter.to),
    );
  }
}
