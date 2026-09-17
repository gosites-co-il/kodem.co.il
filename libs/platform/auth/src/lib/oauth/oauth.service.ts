import { OAuthProfile } from '@kodem/contracts';
import { UserLinkingService } from '@kodem/platform/identity';
import { WorkspaceResolver } from '@kodem/platform/workspace';
import { AuthService } from '../core/auth.service';

export class OAuthService {
  private readonly userLinking = new UserLinkingService();
  private readonly workspaceResolver = new WorkspaceResolver();
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async handleOAuthCallback(profile: OAuthProfile) {
    const { user, isNewUser } = await this.userLinking.resolveFromOAuth(profile);
    if (isNewUser) {
      await this.authService.notifyAdminOfSignup(user, 'oauth');
    }
    const resolved = await this.workspaceResolver.resolveForUser(user);
    return this.authService.issueSession(user, resolved);
  }
}
