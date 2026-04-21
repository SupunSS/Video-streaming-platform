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
  thumbnailUrl: string;

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
/*test commit for ci/cd pipeline*/
