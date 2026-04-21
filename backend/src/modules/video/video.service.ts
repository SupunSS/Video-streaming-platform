import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Video, VideoDocument } from './schemas/video.schema';
import { CreateVideoDto } from './dto/create-video.dto';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(Video.name)
    private readonly videoModel: Model<VideoDocument>,
  ) {}

  async create(
    createVideoDto: CreateVideoDto,
    user: { userId: string; email: string },
  ): Promise<Video> {
    const createdVideo = new this.videoModel({
      ...createVideoDto,
      ownerId: new Types.ObjectId(user.userId),
      ownerEmail: user.email,
    });

    return await createdVideo.save();
  }

  async findAll(): Promise<Video[]> {
    return await this.videoModel
      .find()
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async findOne(id: string): Promise<Video> {
    const video = await this.videoModel.findById(id).exec();
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  async incrementViews(id: string): Promise<Video | null> {
    return await this.videoModel
      .findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
      .exec();
  }
}
