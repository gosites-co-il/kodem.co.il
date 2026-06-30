import { Permission, RoleName } from '@kodem/contracts';
import { hasPermission } from '@kodem/platform/permissions';

export type { JwtPayload, PlatformContext, AuthResult } from '@kodem/contracts';

export { hasPermission };
export { JwtService } from './lib/jwt/jwt.service';
export { AuthService } from './lib/core/auth.service';
export { OAuthService } from './lib/oauth/oauth.service';
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
