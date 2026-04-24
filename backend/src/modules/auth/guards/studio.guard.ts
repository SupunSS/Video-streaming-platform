import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class StudioGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.accountType !== 'studio') {
      throw new ForbiddenException(
        'Only studio accounts can perform this action',
      );
    }

    return true;
  }
}
