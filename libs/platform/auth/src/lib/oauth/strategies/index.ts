import { OAuthProvider } from '@kodem/contracts';
import { createGoogleStrategy } from './google.strategy';
import { createGitHubStrategy } from './github.strategy';
import { createFacebookStrategy } from './facebook.strategy';

export type { OAuthDone } from './google.strategy';
export {
  normalizeGoogleProfile,
  createGoogleStrategy,
} from './google.strategy';
export {
  normalizeGitHubProfile,
  createGitHubStrategy,
} from './github.strategy';
export {
  normalizeFacebookProfile,
  createFacebookStrategy,
} from './facebook.strategy';

export interface OAuthStrategyConfig {
  google?: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  github?: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  facebook?: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
}

export function createOAuthStrategies(config: OAuthStrategyConfig) {
  const strategies: Partial<Record<OAuthProvider, unknown>> = {};
  if (config.google) strategies.google = createGoogleStrategy(config.google);
  if (config.github) strategies.github = createGitHubStrategy(config.github);
  if (config.facebook) {
    strategies.facebook = createFacebookStrategy(config.facebook);
  }
  return strategies;
}
