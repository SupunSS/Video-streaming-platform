import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

import { User, UserDocument } from '../user/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from './mail.service';

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const parseAdminEmails = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async register(registerDto: RegisterDto) {
    const { username, password } = registerDto;
    const email = registerDto.email.trim().toLowerCase();

    const existing = await this.userModel.findOne({ email });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    this.mailService.assertVerificationEmailReady();

    const hashedPassword = await bcrypt.hash(password, 10);
    const verification = this.createEmailVerificationToken();

    const user = await this.userModel.create({
      username,
      email,
      password: hashedPassword,
      accountType: 'user',
      authProvider: 'local',
      emailVerified: false,
      emailVerificationTokenHash: verification.hash,
      emailVerificationExpiresAt: verification.expiresAt,
    });

    const delivery = await this.sendVerificationEmail(user, verification.token);

    return {
      requiresEmailVerification: true,
      email: user.email,
      message: 'Account created. Please verify your email before signing in.',
      verificationUrl: delivery.sent ? undefined : delivery.verificationUrl,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('This account has been banned');
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

    if (user.emailVerified === false) {
      throw new UnauthorizedException(
        'Please verify your email before signing in.',
      );
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
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });
    } else {
      if (user.isBanned) {
        throw new UnauthorizedException('This account has been banned');
      }

      if (!user.googleId) {
        user.googleId = sub;
      }

      if (!user.avatar && picture) {
        user.avatar = picture;
      }

      user.authProvider = user.authProvider || 'google';
      user.emailVerified = true;
      user.emailVerifiedAt = user.emailVerifiedAt ?? new Date();

      await user.save();
    }

    return this.buildAuthResponse(user);
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);

    const user = await this.userModel
      .findOne({
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { $gt: new Date() },
      })
      .select('+emailVerificationTokenHash +emailVerificationExpiresAt')
      .exec();

    if (!user) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('This account has been banned');
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    return this.buildAuthResponse(user);
  }

  async resendVerification(emailInput: string) {
    const email = emailInput.trim().toLowerCase();
    const user = await this.userModel
      .findOne({ email })
      .select('+emailVerificationTokenHash +emailVerificationExpiresAt')
      .exec();

    if (!user) {
      return {
        message:
          'If an unverified account exists for this email, a verification link has been sent.',
      };
    }

    if (user.isBanned) {
      throw new UnauthorizedException('This account has been banned');
    }

    if (user.emailVerified !== false) {
      return {
        message: 'This email is already verified.',
        alreadyVerified: true,
      };
    }

    this.mailService.assertVerificationEmailReady();

    const verification = this.createEmailVerificationToken();
    user.emailVerificationTokenHash = verification.hash;
    user.emailVerificationExpiresAt = verification.expiresAt;
    await user.save();

    const delivery = await this.sendVerificationEmail(user, verification.token);

    return {
      requiresEmailVerification: true,
      email: user.email,
      message: 'Verification email sent.',
      verificationUrl: delivery.sent ? undefined : delivery.verificationUrl,
    };
  }

  private buildAuthResponse(user: UserDocument) {
    const isAdmin = this.isAdminEmail(user.email);

    return {
      access_token: this.jwtService.sign({
        sub: user._id.toString(),
        email: user.email,
        username: user.username,
        accountType: user.accountType,
        isAdmin,
      }),
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        accountType: user.accountType,
        isAdmin,
        emailVerified: user.emailVerified ?? true,
        isBanned: user.isBanned ?? false,
      },
    };
  }

  private createEmailVerificationToken() {
    const token = randomBytes(32).toString('hex');

    return {
      token,
      hash: this.hashToken(token),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async sendVerificationEmail(user: UserDocument, token: string) {
    const verificationUrl = this.buildVerificationUrl(token);
    const delivery = await this.mailService.sendVerificationEmail({
      to: user.email,
      username: user.username,
      verificationUrl,
    });

    return {
      ...delivery,
      verificationUrl,
    };
  }

  private buildVerificationUrl(token: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    return `${frontendUrl.replace(/\/+$/, '')}/verify-email?token=${token}`;
  }

  private isAdminEmail(email?: string) {
    const adminEmails = [
      ...parseAdminEmails(this.configService.get<string>('ADMIN_EMAILS')),
      ...parseAdminEmails(this.configService.get<string>('ADMIN_EMAIL')),
    ];

    return !!email && adminEmails.includes(email.toLowerCase());
  }
}
