import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

import { User, UserDocument } from '../user/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const STUDIO_AGREEMENT_VERSION = '2026-04-30';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async register(registerDto: RegisterDto) {
    const { username, email, password, accountType } = registerDto;
    const isStudioAccount = accountType === 'studio';

    if (isStudioAccount && !registerDto.studioAgreementAccepted) {
      throw new BadRequestException(
        'You must agree to the Studio Account Privacy Policy to create a studio account.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      username,
      email,
      password: hashedPassword,
      accountType: accountType || 'user',
      studioAgreementAccepted: isStudioAccount,
      studioAgreementAcceptedAt: isStudioAccount ? new Date() : undefined,
      studioAgreementVersion: isStudioAccount
        ? STUDIO_AGREEMENT_VERSION
        : undefined,
      authProvider: 'local',
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses Google login. Please continue with Google.',
      );
    }

    const match = await bcrypt.compare(dto.password, user.password);

    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async googleLogin(credential: string) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

    if (!googleClientId) {
      throw new UnauthorizedException('Google Client ID is not configured');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const { sub, email, name, picture } = payload;

    let user = await this.userModel.findOne({ email });

    if (!user) {
      user = await this.userModel.create({
        username: name || email.split('@')[0],
        email,
        avatar: picture,
        googleId: sub,
        authProvider: 'google',
        accountType: 'user',
      });
    } else {
      if (!user.googleId) {
        user.googleId = sub;
      }

      if (!user.avatar && picture) {
        user.avatar = picture;
      }

      user.authProvider = user.authProvider || 'google';

      await user.save();
    }

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: UserDocument) {
    return {
      access_token: this.jwtService.sign({
        sub: user._id.toString(),
        email: user.email,
        username: user.username,
        accountType: user.accountType,
      }),
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        accountType: user.accountType,
      },
    };
  }
}
