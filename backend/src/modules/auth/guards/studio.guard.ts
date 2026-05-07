import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: {
    accountType?: string;
  };
};

@Injectable()
export class StudioGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || user.accountType !== 'studio') {
      throw new ForbiddenException(
        'Only studio accounts can perform this action',
      );
    }

    return true;
  }
}
