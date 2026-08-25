import { Permission, RoleName } from '@kodem/contracts';
import { hasPermission } from '@kodem/platform/permissions';

export type { JwtPayload, PlatformContext, AuthResult } from '@kodem/contracts';

export { hasPermission };
export { JwtService } from './lib/jwt/jwt.service';
export { AuthService } from './lib/core/auth.service';
export { OAuthService } from './lib/oauth/oauth.service';
export {
  AuthTokenService,
  hashToken,
  generateRawToken,
} from './lib/token/auth-token.service';
export {
  RateLimitService,
  type RateLimitResult,
} from './lib/rate-limit/rate-limit.service';
export { PlatformCleanupService } from './lib/cleanup/platform-cleanup.service';
export { platformLog, type LogContext } from './lib/log/platform-log';
export {
  createGoogleStrategy,
  createGitHubStrategy,
  createFacebookStrategy,
  createOAuthStrategies,
  type OAuthStrategyConfig,
} from './lib/oauth/strategies';

export function hasRolePermission(
  role: RoleName,
  permission: Permission,
): boolean {
  return hasPermission(role, permission);
}
