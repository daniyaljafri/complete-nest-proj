export class CreateAssignmentDto {
  officerId: string;
  shiftId: string;
  fromTime: string; 
  toTime: string;   
  daysOfWeek?: number[];
} 