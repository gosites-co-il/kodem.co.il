import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ModuleId, PlatformContext } from '@kodem/contracts';
import { WorkspaceModuleService } from '@kodem/platform/workspace';
import { PLATFORM_CONTEXT_KEY } from './jwt-auth.guard';
import { REQUIRE_MODULE_KEY } from '../decorators/require-module.decorator';

@Injectable()
export class ModuleGuard implements CanActivate {
  private readonly modules = new WorkspaceModuleService();

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const moduleId = this.reflector.getAllAndOverride<ModuleId>(
      REQUIRE_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!moduleId) return true;

    const request = context.switchToHttp().getRequest<{
      [PLATFORM_CONTEXT_KEY]?: PlatformContext;
    }>();
    const platform = request[PLATFORM_CONTEXT_KEY];
    if (!platform) {
      throw new ForbiddenException('Missing platform context');
    }

    const allowed = await this.modules.canUseModule(
      platform.workspace.id,
      moduleId,
    );
    if (!allowed) {
      throw new ForbiddenException(`Module "${moduleId}" is not available`);
    }
    return true;
  }
}
