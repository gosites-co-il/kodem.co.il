import { OAuthProfile, User } from '@kodem/contracts';
import { OAuthAccountRepository } from '@kodem/database';
import { UserService } from './user.service';

export class UserLinkingService {
  private readonly userService = new UserService();
  private readonly oauthRepo = new OAuthAccountRepository();

  async resolveFromOAuth(profile: OAuthProfile): Promise<User> {
    const linked = await this.oauthRepo.findByProvider(
      profile.provider,
      profile.providerUserId,
    );

    if (linked) {
      const user = await this.userService.findById(linked.userId);
      if (!user) {
        throw new Error('OAuth account references missing user');
      }
      return user;
    }

    const byEmail = await this.userService.findByEmail(profile.email);
    if (byEmail) {
      await this.oauthRepo.linkToUser(
        profile.provider,
        profile.providerUserId,
        byEmail.id,
        profile.email,
      );
      return byEmail;
    }

    const user = await this.userService.createOAuthUser({
      email: profile.email,
      name: profile.name,
    });

    await this.oauthRepo.linkToUser(
      profile.provider,
      profile.providerUserId,
      user.id,
      profile.email,
    );

    return user;
  }
}
