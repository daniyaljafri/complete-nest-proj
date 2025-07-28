import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShiftDocument = Shift & Document;

@Schema()
export class Shift {
  @Prop({ required: true }) name: string;
  @Prop() description: string;
  @Prop({ required: true }) startDate: Date; 
  @Prop({ required: true }) endDate: Date;  
}

export const ShiftSchema = SchemaFactory.createForClass(Shift); 