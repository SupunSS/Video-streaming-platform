import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateVideoDto } from './dto/create-video.dto';
import { Video, VideoDocument } from './schemas/video.schema';

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(Video.name)
    private readonly videoModel: Model<VideoDocument>,
  ) {}

  async createVideo(params: {
    dto: CreateVideoDto;
    ownerId: string;
    videoUrl: string;
    thumbnailUrl: string;
  }) {
    const { dto, ownerId, videoUrl, thumbnailUrl } = params;

    const payload = {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      genres: dto.genres ?? [],
      categories: dto.categories ?? [],
      language: dto.language ?? '',
      ageRating: dto.ageRating ?? '',
      releaseYear: dto.releaseYear,
      isFeatured: dto.isFeatured ?? false,
      seriesTitle: dto.type === 'tv_show' ? (dto.seriesTitle ?? '') : '',
      seasonNumber: dto.type === 'tv_show' ? dto.seasonNumber : undefined,
      episodeNumber: dto.type === 'tv_show' ? dto.episodeNumber : undefined,
      episodeTitle: dto.type === 'tv_show' ? (dto.episodeTitle ?? '') : '',
      videoUrl,
      thumbnailUrl,
      owner: new Types.ObjectId(ownerId),
      isPublished: true,
      views: 0,
    };

    const created = await this.videoModel.create(payload);
    return created;
  }
}
