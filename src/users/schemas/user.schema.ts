import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  ADMIN = 'admin',
  OFFICER = 'officer',
  SUPERVISOR = 'supervisor',
}

@Schema()
export class User {
  @Prop({ unique: true }) email: string;
  @Prop() username: string;
  @Prop() password: string;
  @Prop({ enum: Role }) role: Role;
  @Prop({ default: false }) isLoggedIn: boolean;
  @Prop() loginTime: Date;
  @Prop() logoutTime: Date;

  //just for checking not req tho
  @Prop() lastLoginTime: Date;
  @Prop() lastLogoutTime: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
