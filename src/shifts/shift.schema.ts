import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShiftDocument = Shift & Document;

@Schema()
export class Shift {
  @Prop({ required: true }) name: string;
  @Prop() description: string;
  @Prop({ required: true }) startDate: Date; // UTC
  @Prop({ required: true }) endDate: Date;   // UTC
}

export const ShiftSchema = SchemaFactory.createForClass(Shift); 