import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HealthService } from '../health/health.service';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Video, VideoDocument } from '../video/schemas/video.schema';
import { BanVideoDto } from './dto/ban-video.dto';

type AdminUser = {
  _id: Types.ObjectId;
  username?: string;
  email?: string;
  avatar?: string;
  authProvider?: string;
  accountType?: string;
  studioAgreementAccepted?: boolean;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: Date;
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

type PopulatedOwner = {
  _id: Types.ObjectId;
  username?: string;
  email?: string;
  avatar?: string;
  accountType?: string;
};

type AdminVideo = {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  posterUrl?: string;
  type?: 'movie' | 'tv_show';
  genres?: string[];
  categories?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: Date;
  views?: number;
  ratingsCount?: number;
  averageRating?: number;
  owner: Types.ObjectId | PopulatedOwner;
  createdAt?: Date;
  updatedAt?: Date;
};

const ownerSelect = 'username email avatar accountType';

const parseAdminEmails = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isPopulatedOwner = (
  owner: Types.ObjectId | PopulatedOwner,
): owner is PopulatedOwner => !(owner instanceof Types.ObjectId);

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Video.name) private readonly videoModel: Model<VideoDocument>,
    private readonly healthService: HealthService,
    private readonly configService: ConfigService,
  ) {}

  async getOverview() {
    const [
      totalUsers,
      studioAccounts,
      viewerAccounts,
      bannedUsers,
      totalVideos,
      publishedVideos,
      bannedVideos,
      viewsAggregate,
      health,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ accountType: 'studio' }).exec(),
      this.userModel.countDocuments({ accountType: 'user' }).exec(),
      this.userModel.countDocuments({ isBanned: true }).exec(),
      this.videoModel.countDocuments().exec(),
      this.videoModel
        .countDocuments({ isPublished: true, isBanned: { $ne: true } })
        .exec(),
      this.videoModel.countDocuments({ isBanned: true }).exec(),
      this.videoModel
        .aggregate<{ totalViews: number }>([
          { $group: { _id: null, totalViews: { $sum: '$views' } } },
        ])
        .exec(),
      this.getServerHealth(),
    ]);

    return {
      metrics: {
        totalUsers,
        studioAccounts,
        viewerAccounts,
        bannedUsers,
        totalVideos,
        publishedVideos,
        bannedVideos,
        totalViews: viewsAggregate[0]?.totalViews ?? 0,
      },
      health,
    };
  }

  async listUsers() {
    const [users, videoCounts] = await Promise.all([
      this.userModel
        .find()
        .select('-password -googleId')
        .sort({ createdAt: -1 })
        .lean<AdminUser[]>()
        .exec(),
      this.videoModel
        .aggregate<{ _id: Types.ObjectId; videosCount: number }>([
          { $group: { _id: '$owner', videosCount: { $sum: 1 } } },
        ])
        .exec(),
    ]);

    const countsByOwner = new Map(
      videoCounts.map((item) => [item._id.toString(), item.videosCount]),
    );

    return users.map((user) => ({
      _id: user._id.toString(),
      username: user.username ?? 'Unknown user',
      email: user.email ?? '',
      avatar: user.avatar ?? '',
      authProvider: user.authProvider ?? 'local',
      accountType: user.accountType ?? 'user',
      studioAgreementAccepted: user.studioAgreementAccepted ?? false,
      isAdmin: this.isAdminEmail(user.email),
      isBanned: user.isBanned ?? false,
      banReason: user.banReason ?? '',
      bannedAt: user.bannedAt?.toISOString() ?? null,
      emailVerified: user.emailVerified ?? true,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      videosCount: countsByOwner.get(user._id.toString()) ?? 0,
      createdAt: user.createdAt?.toISOString() ?? '',
      updatedAt: user.updatedAt?.toISOString() ?? '',
    }));
  }

  async listVideos() {
    const videos = await this.videoModel
      .find()
      .sort({ createdAt: -1 })
      .populate<{ owner: PopulatedOwner }>('owner', ownerSelect)
      .lean<AdminVideo[]>()
      .exec();

    return videos.map((video) => this.serializeVideo(video));
  }

  async banVideo(id: string, dto: BanVideoDto) {
    this.ensureObjectId(id);

    const video = await this.videoModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            isBanned: true,
            isPublished: false,
            banReason: dto.reason?.trim() ?? '',
            bannedAt: new Date(),
          },
        },
        { returnDocument: 'after' },
      )
      .populate<{ owner: PopulatedOwner }>('owner', ownerSelect)
      .lean<AdminVideo | null>()
      .exec();

    if (!video) throw new NotFoundException('Video not found');
    return this.serializeVideo(video);
  }

  async unbanVideo(id: string) {
    this.ensureObjectId(id);

    const video = await this.videoModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            isBanned: false,
            isPublished: true,
          },
          $unset: {
            banReason: '',
            bannedAt: '',
          },
        },
        { returnDocument: 'after' },
      )
      .populate<{ owner: PopulatedOwner }>('owner', ownerSelect)
      .lean<AdminVideo | null>()
      .exec();

    if (!video) throw new NotFoundException('Video not found');
    return this.serializeVideo(video);
  }

  async banUser(id: string, dto: BanVideoDto, adminUserId: string) {
    this.ensureObjectId(id, 'User not found');

    if (id === adminUserId) {
      throw new BadRequestException('You cannot ban your own owner account');
    }

    const target = await this.userModel.findById(id).select('email').exec();

    if (!target) throw new NotFoundException('User not found');

    if (this.isAdminEmail(target.email)) {
      throw new ForbiddenException('Owner accounts cannot be banned');
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            isBanned: true,
            banReason: dto.reason?.trim() ?? '',
            bannedAt: new Date(),
          },
        },
        { returnDocument: 'after' },
      )
      .select('-password -googleId')
      .lean<AdminUser | null>()
      .exec();

    await this.videoModel
      .updateMany(
        { owner: new Types.ObjectId(id) },
        { $set: { isPublished: false } },
      )
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return this.serializeUser(user, 0);
  }

  async unbanUser(id: string) {
    this.ensureObjectId(id, 'User not found');

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            isBanned: false,
          },
          $unset: {
            banReason: '',
            bannedAt: '',
          },
        },
        { returnDocument: 'after' },
      )
      .select('-password -googleId')
      .lean<AdminUser | null>()
      .exec();

    await this.videoModel
      .updateMany(
        { owner: new Types.ObjectId(id), isBanned: { $ne: true } },
        { $set: { isPublished: true } },
      )
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return this.serializeUser(user, 0);
  }

  private async getServerHealth() {
    try {
      const readiness = await this.healthService.getReadiness();
      return this.withRuntimeDetails(readiness);
    } catch {
      return this.withRuntimeDetails({
        status: 'error' as const,
        service: 'flux-backend',
        timestamp: new Date().toISOString(),
        uptime: Number(process.uptime().toFixed(3)),
        checks: {
          api: 'ok' as const,
          database: 'error' as const,
        },
      });
    }
  }

  private withRuntimeDetails<T extends Record<string, unknown>>(health: T) {
    const memory = process.memoryUsage();

    return {
      ...health,
      databaseState: this.healthService.getDatabaseState(),
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV ?? 'development',
        memory: {
          rssMb: Math.round(memory.rss / 1024 / 1024),
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
        },
      },
    };
  }

  private ensureObjectId(id: string, message = 'Video not found') {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(message);
    }
  }

  private isAdminEmail(email?: string) {
    const adminEmails = [
      ...parseAdminEmails(this.configService.get<string>('ADMIN_EMAILS')),
      ...parseAdminEmails(this.configService.get<string>('ADMIN_EMAIL')),
    ];

    return !!email && adminEmails.includes(email.toLowerCase());
  }

  private serializeUser(user: AdminUser, videosCount: number) {
    return {
      _id: user._id.toString(),
      username: user.username ?? 'Unknown user',
      email: user.email ?? '',
      avatar: user.avatar ?? '',
      authProvider: user.authProvider ?? 'local',
      accountType: user.accountType ?? 'user',
      studioAgreementAccepted: user.studioAgreementAccepted ?? false,
      isAdmin: this.isAdminEmail(user.email),
      isBanned: user.isBanned ?? false,
      banReason: user.banReason ?? '',
      bannedAt: user.bannedAt?.toISOString() ?? null,
      emailVerified: user.emailVerified ?? true,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      videosCount,
      createdAt: user.createdAt?.toISOString() ?? '',
      updatedAt: user.updatedAt?.toISOString() ?? '',
    };
  }

  private serializeVideo(video: AdminVideo) {
    const owner = isPopulatedOwner(video.owner) ? video.owner : undefined;

    return {
      _id: video._id.toString(),
      title: video.title,
      description: video.description ?? '',
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      posterUrl: video.posterUrl ?? video.thumbnailUrl,
      type: video.type ?? 'movie',
      genres: video.genres ?? [],
      categories: video.categories ?? [],
      isPublished: video.isPublished ?? false,
      isFeatured: video.isFeatured ?? false,
      isBanned: video.isBanned ?? false,
      banReason: video.banReason ?? '',
      bannedAt: video.bannedAt?.toISOString() ?? null,
      views: video.views ?? 0,
      ratingsCount: video.ratingsCount ?? 0,
      averageRating: video.averageRating ?? 0,
      owner: isPopulatedOwner(video.owner)
        ? video.owner._id.toString()
        : video.owner.toString(),
      ownerId: owner
        ? {
            _id: owner._id.toString(),
            username: owner.username ?? 'Unknown Studio',
            email: owner.email ?? '',
            avatar: owner.avatar,
            accountType: owner.accountType ?? 'user',
          }
        : undefined,
      createdAt: video.createdAt?.toISOString() ?? '',
      updatedAt: video.updatedAt?.toISOString() ?? '',
    };
  }
}
