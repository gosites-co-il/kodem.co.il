import { Strategy as GitHubStrategy } from 'passport-github2';
import { OAuthProfile } from '@kodem/contracts';
import type { OAuthDone } from './google.strategy';

export function normalizeGitHubProfile(
  _accessToken: string,
  _refreshToken: string,
  profile: {
    id: string;
    emails?: { value: string }[];
    username?: string;
    displayName?: string;
  },
  done: OAuthDone,
) {
  const email = profile.emails?.[0]?.value;
  if (!email) {
    return done(new Error('GitHub account has no public email'));
  }
  done(null, {
    provider: 'github',
    providerUserId: String(profile.id),
    email,
    name: profile.displayName ?? profile.username ?? email.split('@')[0],
  });
}

export function createGitHubStrategy(config: {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}) {
  return new GitHubStrategy(
    {
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: ['user:email'],
    },
    normalizeGitHubProfile,
  );
}
