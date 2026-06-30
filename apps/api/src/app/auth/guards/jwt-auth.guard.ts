import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService, JwtService } from '@kodem/platform/auth';
import { PlatformContext } from '@kodem/contracts';

export const PLATFORM_CONTEXT_KEY = 'platformContext';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtService: JwtService;
  private readonly authService: AuthService;

  constructor() {
    const secret = process.env['JWT_SECRET'] ?? 'kodem-dev-secret-change-in-production';
    this.jwtService = new JwtService({ secret });
    this.authService = new AuthService(this.jwtService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = this.jwtService.verify(token);
      const platformContext = await this.authService.resolveContext(payload);
      (request as Request & { [PLATFORM_CONTEXT_KEY]: PlatformContext })[
        PLATFORM_CONTEXT_KEY
      ] = platformContext;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | null {
    const auth = request.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      return auth.slice(7);
    }
    const queryToken = request.query['token'];
    if (typeof queryToken === 'string') {
      return queryToken;
    }
    return null;
  }
}
