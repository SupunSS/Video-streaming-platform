import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    username: string;
    accountType: string;
    isAdmin?: boolean;
  }) {
    const user = await this.userModel
      .findById(payload.sub)
      .select('email username accountType isBanned')
      .lean<{
        email?: string;
        username?: string;
        accountType?: string;
        isBanned?: boolean;
      } | null>()
      .exec();

    if (!user || user.isBanned) {
      throw new UnauthorizedException('Account is not active');
    }

    return {
      userId: payload.sub,
      email: user.email ?? payload.email,
      username: user.username ?? payload.username,
      accountType: user.accountType ?? payload.accountType,
      isAdmin: payload.isAdmin ?? false,
    };
  }
}
