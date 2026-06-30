import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { OAuthProfile } from '@kodem/contracts';

export type OAuthDone = (
  err: Error | null,
  profile?: OAuthProfile,
) => void;

export function normalizeGoogleProfile(
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
    return done(new Error('Google account has no email'));
  }
  done(null, {
    provider: 'google',
    providerUserId: profile.id,
    email,
    name: profile.displayName ?? email.split('@')[0],
  });
}

export function createGoogleStrategy(config: {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}) {
  return new GoogleStrategy(
    {
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: ['email', 'profile'],
    },
    normalizeGoogleProfile,
  );
}
