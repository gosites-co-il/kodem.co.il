import { Auditable } from './types';
import { UserId } from './ids';

export type OAuthProvider = 'google' | 'github' | 'facebook';

export interface OAuthAccount extends Auditable {
  id: string;
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  userId: UserId;
}

export interface OAuthProfile {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  name: string;
}
