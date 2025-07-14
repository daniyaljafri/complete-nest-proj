import { IsDateString } from 'class-validator';

export class FilterDateDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
