import { IsDateString } from 'class-validator';

export class FindAvailableOfficersDto {
  @IsDateString()
  fromTime: string; // ISO date string

  @IsDateString()
  toTime: string; // ISO date string
} 