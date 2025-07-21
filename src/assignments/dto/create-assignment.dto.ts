export class CreateAssignmentDto {
  officerId: string;
  shiftId: string;
  fromTime: string; // ISO string
  toTime: string;   // ISO string
  daysOfWeek?: number[];
} 