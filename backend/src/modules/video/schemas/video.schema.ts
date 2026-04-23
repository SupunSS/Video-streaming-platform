import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VideoDocument = HydratedDocument<Video>;

@Schema({ timestamps: true })
export class Video {
  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true })
  videoUrl: string;

  @Prop({ required: true })
  thumbnailUrl: string; // 16:9 landscape — used on video page

  @Prop({ default: '' })
  posterUrl: string; // 2:3 portrait — used on cards

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  duration: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  ownerEmail: string;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
