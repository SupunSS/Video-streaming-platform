import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../user/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password, accountType } = registerDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      username,
      email,
      password: hashedPassword,
      accountType: accountType || 'user',
    });

    return this.buildAuthResponse(user); // ✅ fixed: was generateToken
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: UserDocument) {
    return {
      access_token: this.jwtService.sign({
        sub: user._id.toString(),
        email: user.email,
        username: user.username, // ✅ added
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
