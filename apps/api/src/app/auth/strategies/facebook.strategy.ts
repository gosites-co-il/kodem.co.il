import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-facebook';
import { OAuthProfile } from '@kodem/contracts';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env['FACEBOOK_CLIENT_ID'] ?? 'facebook-client-id',
      clientSecret:
        process.env['FACEBOOK_CLIENT_SECRET'] ?? 'facebook-client-secret',
      callbackURL:
        process.env['FACEBOOK_CALLBACK_URL'] ??
        'http://localhost:3333/api/auth/facebook/callback',
      profileFields: ['id', 'emails', 'displayName'],
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
      throw new Error('Facebook account has no email');
    }
    return {
      provider: 'facebook',
      providerUserId: profile.id,
      email,
      name: profile.displayName ?? email.split('@')[0],
    };
  }
}
