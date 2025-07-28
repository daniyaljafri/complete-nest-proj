import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssignmentDocument = Assignment & Document;

@Schema()
export class Assignment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  officerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Shift', required: true })
  shiftId: Types.ObjectId;

  @Prop({ required: true })
  fromTime: Date; // UTC datetime

  @Prop({ required: true })
  toTime: Date;   

  @Prop({ type: [Number] }) // 0=Sunday, 
  daysOfWeek?: number[];
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment); 