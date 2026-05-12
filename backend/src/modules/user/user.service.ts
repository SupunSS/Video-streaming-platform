import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

const parseAdminEmails = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async getMe(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return this.serializeUser(user);
  }

  async updateAvatar(userId: string, avatar: string) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { avatar }, { returnDocument: 'after' })
      .select('-password')
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return this.serializeUser(user);
  }

  // ✅ new method
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // check if email is taken by another user
    if (dto.email) {
      const existing = await this.userModel.findOne({
        email: dto.email,
        _id: { $ne: userId },
      });
      if (existing) throw new ConflictException('Email already in use');
    }

    // check if username is taken by another user
    if (dto.username) {
      const existing = await this.userModel.findOne({
        username: dto.username,
        _id: { $ne: userId },
      });
      if (existing) throw new ConflictException('Username already taken');
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { ...dto }, { returnDocument: 'after' })
      .select('-password')
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return this.serializeUser(user);
  }

  private serializeUser(user: UserDocument) {
    const plain = user.toObject();
    const { password: _password, ...safeUser } = plain;

    return {
      ...safeUser,
      isAdmin: this.isAdminEmail(safeUser.email),
      isBanned: safeUser.isBanned ?? false,
      banReason: safeUser.banReason ?? '',
      bannedAt: safeUser.bannedAt ?? null,
    };
  }

  private isAdminEmail(email?: string) {
    const adminEmails = [
      ...parseAdminEmails(this.configService.get<string>('ADMIN_EMAILS')),
      ...parseAdminEmails(this.configService.get<string>('ADMIN_EMAIL')),
    ];

    return !!email && adminEmails.includes(email.toLowerCase());
  }
}
