import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  // Optional because Google users do not have a password
  @Prop()
  password?: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop()
  googleId?: string;

  @Prop({ default: 'local', enum: ['local', 'google'] })
  authProvider: string;

  @Prop({ default: 'user', enum: ['user', 'studio'] })
  accountType: string;

  @Prop({ default: false })
  studioAgreementAccepted: boolean;

  @Prop()
  studioAgreementAcceptedAt?: Date;

  @Prop()
  studioAgreementVersion?: string;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop({ trim: true, default: '' })
  banReason: string;

  @Prop()
  bannedAt?: Date;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVerifiedAt?: Date;

  @Prop({ select: false })
  emailVerificationTokenHash?: string;

  @Prop({ select: false })
  emailVerificationExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
