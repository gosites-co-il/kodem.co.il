import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-github2';
import { OAuthProfile } from '@kodem/contracts';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env['GITHUB_CLIENT_ID'] ?? 'github-client-id',
      clientSecret: process.env['GITHUB_CLIENT_SECRET'] ?? 'github-client-secret',
      callbackURL:
        process.env['GITHUB_CALLBACK_URL'] ??
        'http://localhost:3333/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: { value: string }[];
      username?: string;
      displayName?: string;
    },
  ): OAuthProfile {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new Error('GitHub account has no public email');
    }
    return {
      provider: 'github',
      providerUserId: String(profile.id),
      email,
      name: profile.displayName ?? profile.username ?? email.split('@')[0],
    };
  }
}
