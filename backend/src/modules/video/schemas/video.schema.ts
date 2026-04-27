import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VideoDocument = HydratedDocument<Video>;

@Schema({ timestamps: true })
export class Video {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true })
  videoUrl: string;

  @Prop({ required: true })
  thumbnailUrl: string;

  @Prop({ required: true, enum: ['movie', 'tv_show'], default: 'movie' })
  type: 'movie' | 'tv_show';

  @Prop({ type: [String], default: [] })
  genres: string[];

  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop({ trim: true, default: '' })
  language: string;

  @Prop({ trim: true, default: '' })
  ageRating: string;

  @Prop({ min: 1900, max: 3000, required: false })
  releaseYear?: number;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ default: 0 })
  views: number;

  @Prop({ trim: true, default: '' })
  seriesTitle?: string;

  @Prop({ min: 1, required: false })
  seasonNumber?: number;

  @Prop({ min: 1, required: false })
  episodeNumber?: number;

  @Prop({ trim: true, default: '' })
  episodeTitle?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
