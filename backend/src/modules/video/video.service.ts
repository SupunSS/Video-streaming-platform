import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateVideoDto } from './dto/create-video.dto';
import { Video, VideoDocument } from './schemas/video.schema';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(Video.name)
    private readonly videoModel: Model<Video>,
  ) {}

  async create(
    createVideoDto: CreateVideoDto,
    user: {
      userId: string;
      email: string;
      username: string;
      accountType: string;
    },
  ): Promise<VideoDocument> {
    const createdVideo = new this.videoModel({
      ...createVideoDto,
      ownerId: new Types.ObjectId(user.userId),
      ratings: [],
      averageRating: 0,
      ratingsCount: 0,
    });

    return await createdVideo.save();
  }
  async findAll(): Promise<VideoDocument[]> {
    return await this.videoModel
      .find()
      .populate('ownerId', 'username email avatar accountType') // ✅ added
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async findMyVideos(userId: string): Promise<VideoDocument[]> {
    return await this.videoModel
      .find({ ownerId: new Types.ObjectId(userId) })
      .populate('ownerId', 'username email avatar accountType') // ✅ added
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<VideoDocument> {
    const video = await this.videoModel
      .findById(id)
      .populate('ownerId', 'username email avatar accountType') // ✅ added
      .exec();

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }

  async incrementViews(id: string): Promise<VideoDocument | null> {
    return await this.videoModel
      .findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
      .exec();
  }

  async rateVideo(
    id: string,
    userId: string,
    value: number,
  ): Promise<VideoDocument> {
    const video = await this.videoModel.findById(id).exec();

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const normalizedUserId = new Types.ObjectId(userId);
    const existingIndex = video.ratings.findIndex(
      (rating) => rating.userId.toString() === normalizedUserId.toString(),
    );

    if (existingIndex >= 0) {
      video.ratings[existingIndex].value = value;
    } else {
      video.ratings.push({
        userId: normalizedUserId,
        value,
      } as never);
    }

    const total = video.ratings.reduce((sum, rating) => sum + rating.value, 0);
    const count = video.ratings.length;

    video.ratingsCount = count;
    video.averageRating = count > 0 ? Number((total / count).toFixed(1)) : 0;

    await video.save();

    return video;
  }
}
