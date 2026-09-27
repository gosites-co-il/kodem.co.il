import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PlatformContext } from '@kodem/contracts';
import { PLATFORM_CONTEXT_KEY } from '../auth/guards/jwt-auth.guard';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const platform = request[PLATFORM_CONTEXT_KEY] as PlatformContext | undefined;
    if (platform?.user.platformRole !== 'super_admin') {
      throw new ForbiddenException('נדרשת הרשאת סופר־אדמין');
    }
    return true;
  }
}
