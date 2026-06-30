import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-google-oauth20';
import { OAuthProfile } from '@kodem/contracts';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env['GOOGLE_CLIENT_ID'] ?? 'google-client-id',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? 'google-client-secret',
      callbackURL:
        process.env['GOOGLE_CALLBACK_URL'] ??
        'http://localhost:3333/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: { value: string }[];
      displayName?: string;
    },
  ): OAuthProfile {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new Error('Google account has no email');
    }
    return {
      provider: 'google',
      providerUserId: profile.id,
      email,
      name: profile.displayName ?? email.split('@')[0],
    };
  }
}
