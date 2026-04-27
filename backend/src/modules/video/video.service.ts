import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateVideoDto } from './dto/create-video.dto';
import { Video, VideoDocument, VideoRating } from './schemas/video.schema';

type PopulatedOwner = {
  _id: Types.ObjectId;
  username?: string;
  email?: string;
  avatar?: string;
  accountType?: string;
};

type LeanVideo = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  posterUrl?: string;
  tags?: string[];
  type: 'movie' | 'tv_show';
  genres?: string[];
  categories?: string[];
  language?: string;
  ageRating?: string;
  releaseYear?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  views?: number;
  ratingsCount?: number;
  averageRating?: number;
  ratings?: VideoRating[];
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  owner: Types.ObjectId | PopulatedOwner;
  createdAt?: Date;
  updatedAt?: Date;
};

type SerializedVideo = Omit<
  LeanVideo,
  '_id' | 'owner' | 'ratings' | 'createdAt' | 'updatedAt'
> & {
  _id: string;
  owner: string;
  ownerId?: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    accountType: string;
  };
  user?: {
    username: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  myRating?: number | null;
};

const ownerSelect = 'username email avatar accountType';

function isPopulatedOwner(
  owner: Types.ObjectId | PopulatedOwner,
): owner is PopulatedOwner {
  return !(owner instanceof Types.ObjectId);
}

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(Video.name)
    private readonly videoModel: Model<VideoDocument>,
  ) {}

  async createVideo(params: {
    dto: CreateVideoDto;
    ownerId: string;
    videoUrl: string;
    thumbnailUrl: string;
    posterUrl?: string;
  }) {
    const { dto, ownerId, videoUrl, thumbnailUrl, posterUrl } = params;

    const payload = {
      title: dto.title,
      description: dto.description ?? '',
      type: dto.type,
      tags: dto.tags ?? [],
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
      posterUrl: posterUrl ?? dto.posterUrl ?? thumbnailUrl,
      owner: new Types.ObjectId(ownerId),
      isPublished: true,
      views: 0,
      ratingsCount: 0,
      averageRating: 0,
      ratings: [],
    };

    const created = await this.videoModel.create(payload);
    return this.findOne(created._id.toString());
  }

  async getAll(): Promise<SerializedVideo[]> {
    const videos = await this.videoModel
      .find({ isPublished: true })
      .sort({ createdAt: -1 })
      .populate<{ owner: PopulatedOwner }>('owner', ownerSelect)
      .lean<LeanVideo[]>()
      .exec();

    return videos.map((video) => this.serialize(video));
  }

  async getMyVideos(ownerId: string): Promise<SerializedVideo[]> {
    const videos = await this.videoModel
      .find({ owner: new Types.ObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .populate<{ owner: PopulatedOwner }>('owner', ownerSelect)
      .lean<LeanVideo[]>()
      .exec();

    return videos.map((video) => this.serialize(video));
  }

  async findOne(id: string, viewerId?: string): Promise<SerializedVideo> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Video not found');
    }

    const video = await this.videoModel
      .findById(id)
      .populate<{ owner: PopulatedOwner }>('owner', ownerSelect)
      .lean<LeanVideo | null>()
      .exec();

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return this.serialize(video, viewerId);
  }

  async incrementViews(id: string): Promise<SerializedVideo> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Video not found');
    }

    const video = await this.videoModel
      .findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
      .populate<{ owner: PopulatedOwner }>('owner', ownerSelect)
      .lean<LeanVideo | null>()
      .exec();

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return this.serialize(video);
  }

  async getMyRating(
    id: string,
    userId: string,
  ): Promise<{ value: number | null }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Video not found');
    }

    const video = await this.videoModel
      .findById(id)
      .select('ratings')
      .lean<Pick<LeanVideo, 'ratings'> | null>()
      .exec();

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return { value: this.getViewerRating(video.ratings, userId) };
  }

  async rateVideo(
    id: string,
    userId: string,
    value: number,
  ): Promise<SerializedVideo> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Video not found');
    }

    const video = await this.videoModel.findById(id).exec();

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const ratings = video.ratings ?? [];
    const existingRating = ratings.find(
      (rating) => rating.userId.toString() === userId,
    );

    if (existingRating) {
      existingRating.value = value;
    } else {
      ratings.push({ userId: userObjectId, value });
    }

    const summary = this.calculateRatingSummary(ratings);

    video.ratings = ratings;
    video.ratingsCount = summary.ratingsCount;
    video.averageRating = summary.averageRating;

    await video.save();

    return this.findOne(id, userId);
  }

  private calculateRatingSummary(ratings: VideoRating[]) {
    const ratingsCount = ratings.length;

    if (ratingsCount === 0) {
      return { ratingsCount: 0, averageRating: 0 };
    }

    const total = ratings.reduce((sum, rating) => sum + rating.value, 0);
    return { ratingsCount, averageRating: total / ratingsCount };
  }

  private getViewerRating(
    ratings: VideoRating[] | undefined,
    viewerId?: string,
  ): number | null {
    if (!viewerId) {
      return null;
    }

    const rating = ratings?.find((item) => item.userId.toString() === viewerId);
    return rating?.value ?? null;
  }

  private serialize(video: LeanVideo, viewerId?: string): SerializedVideo {
    const { ratings, ...publicVideo } = video;
    const owner = isPopulatedOwner(video.owner) ? video.owner : undefined;
    const ownerId = owner
      ? {
          _id: owner._id.toString(),
          username: owner.username ?? 'Unknown Studio',
          email: owner.email ?? '',
          avatar: owner.avatar,
          accountType: owner.accountType ?? 'user',
        }
      : undefined;

    return {
      ...publicVideo,
      _id: video._id.toString(),
      owner: isPopulatedOwner(video.owner)
        ? video.owner._id.toString()
        : video.owner.toString(),
      ownerId,
      user: ownerId
        ? {
            username: ownerId.username,
            avatar: ownerId.avatar,
          }
        : undefined,
      posterUrl: video.posterUrl || video.thumbnailUrl,
      tags: video.tags ?? [],
      genres: video.genres ?? [],
      categories: video.categories ?? [],
      language: video.language ?? '',
      ageRating: video.ageRating ?? '',
      isFeatured: video.isFeatured ?? false,
      isPublished: video.isPublished ?? true,
      views: video.views ?? 0,
      ratingsCount: video.ratingsCount ?? 0,
      averageRating: video.averageRating ?? 0,
      myRating: this.getViewerRating(ratings, viewerId),
      createdAt: video.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: video.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
