import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

type AdminRequest = Request & {
  user?: {
    email?: string;
  };
};

const parseAdminEmails = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const userEmail = request.user?.email?.toLowerCase();
    const adminEmails = [
      ...parseAdminEmails(this.configService.get<string>('ADMIN_EMAILS')),
      ...parseAdminEmails(this.configService.get<string>('ADMIN_EMAIL')),
    ];

    if (adminEmails.length === 0) {
      throw new ForbiddenException('Admin access is not configured');
    }

    if (!userEmail || !adminEmails.includes(userEmail)) {
      throw new ForbiddenException('Website owner access required');
    }

    return true;
  }
}
