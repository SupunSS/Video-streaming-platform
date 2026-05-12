import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VideoDocument = HydratedDocument<Video>;

export type VideoRating = {
  userId: Types.ObjectId;
  value: number;
};

@Schema({ timestamps: true })
export class Video {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ required: true })
  videoUrl: string;

  @Prop({ required: true })
  thumbnailUrl: string;

  @Prop({ trim: true, default: '' })
  posterUrl: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

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

  @Prop({ default: 0, min: 0 })
  duration: number;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop({ trim: true, default: '' })
  banReason: string;

  @Prop()
  bannedAt?: Date;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  ratingsCount: number;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({
    type: [
      {
        _id: false,
        userId: { type: Types.ObjectId, ref: 'User', required: true },
        value: { type: Number, required: true, min: 1, max: 10 },
      },
    ],
    default: [],
  })
  ratings: VideoRating[];

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
