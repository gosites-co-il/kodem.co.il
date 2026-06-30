import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlatformContext } from '@kodem/contracts';
import { PLATFORM_CONTEXT_KEY } from '../guards/jwt-auth.guard';

export const CurrentContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PlatformContext => {
    const request = ctx.switchToHttp().getRequest();
    return request[PLATFORM_CONTEXT_KEY];
  },
);
