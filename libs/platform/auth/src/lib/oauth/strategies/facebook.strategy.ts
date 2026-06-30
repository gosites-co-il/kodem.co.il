import { Strategy as FacebookStrategy } from 'passport-facebook';
import type { OAuthDone } from './google.strategy';

export function normalizeFacebookProfile(
  _accessToken: string,
  _refreshToken: string,
  profile: {
    id: string;
    emails?: { value: string }[];
    displayName?: string;
  },
  done: OAuthDone,
) {
  const email = profile.emails?.[0]?.value;
  if (!email) {
    return done(new Error('Facebook account has no email'));
  }
  done(null, {
    provider: 'facebook',
    providerUserId: profile.id,
    email,
    name: profile.displayName ?? email.split('@')[0],
  });
}

export function createFacebookStrategy(config: {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}) {
  return new FacebookStrategy(
    {
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      profileFields: ['id', 'emails', 'displayName'],
    },
    normalizeFacebookProfile,
  );
}
