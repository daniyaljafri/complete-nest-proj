import { IsDateString } from 'class-validator';

export class FindAvailableOfficersDto {
  @IsDateString()
  fromTime: string; // ISO date string for assignment start

  @IsDateString()
  toTime: string; // ISO date string for assignment end
} 