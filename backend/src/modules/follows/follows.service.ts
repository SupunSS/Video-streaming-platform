import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow, FollowDocument } from './schemas/follow.schema';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
  ) {}

  async follow(followerId: string, targetId: string) {
    if (followerId === targetId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existing = await this.followModel.findOne({
      follower: new Types.ObjectId(followerId),
      following: new Types.ObjectId(targetId),
    });

    if (existing) {
      throw new BadRequestException('Already following');
    }

    return this.followModel.create({
      follower: new Types.ObjectId(followerId),
      following: new Types.ObjectId(targetId),
    });
  }

  async unfollow(followerId: string, targetId: string) {
    const result = await this.followModel.findOneAndDelete({
      follower: new Types.ObjectId(followerId),
      following: new Types.ObjectId(targetId),
    });

    if (!result) {
      throw new NotFoundException('Follow relationship not found');
    }

    return { message: 'Unfollowed successfully' };
  }

  async getFollowers(userId: string) {
    return this.followModel
      .find({ following: new Types.ObjectId(userId) })
      .populate('follower', 'username email accountType');
  }

  async getFollowing(userId: string) {
    return this.followModel
      .find({ follower: new Types.ObjectId(userId) })
      .populate('following', 'username email accountType');
  }

  async getFollowerCount(userId: string): Promise<number> {
    return this.followModel.countDocuments({
      following: new Types.ObjectId(userId),
    });
  }

  async isFollowing(followerId: string, targetId: string): Promise<boolean> {
    const exists = await this.followModel.findOne({
      follower: new Types.ObjectId(followerId),
      following: new Types.ObjectId(targetId),
    });
    return !!exists;
  }
}
