export class CreateShiftDto {
  name: string;
  description?: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
} 