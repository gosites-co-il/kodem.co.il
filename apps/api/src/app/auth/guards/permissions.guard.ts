import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission, PlatformContext } from '@kodem/contracts';
import { hasPermission } from '@kodem/platform/permissions';
import { PLATFORM_CONTEXT_KEY } from './jwt-auth.guard';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{
      [PLATFORM_CONTEXT_KEY]?: PlatformContext;
    }>();
    const platform = request[PLATFORM_CONTEXT_KEY];
    if (!platform) {
      throw new ForbiddenException('Missing platform context');
    }

    const ok = required.every((p) => hasPermission(platform.role, p));
    if (!ok) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
