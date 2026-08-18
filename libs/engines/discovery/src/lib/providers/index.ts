import { FacebookProvider } from './facebook.provider';
import { GoogleBusinessProvider } from './google-business.provider';
import { InstagramProvider } from './instagram.provider';
import { LinkedInProvider } from './linkedin.provider';
import { TikTokProvider } from './tiktok.provider';
import { WebsiteProvider } from './website.provider';

export function createDefaultProviders() {
  return [
    new WebsiteProvider(),
    new FacebookProvider(),
    new GoogleBusinessProvider(),
    new InstagramProvider(),
    new LinkedInProvider(),
    new TikTokProvider(),
  ];
}

export { WebsiteProvider } from './website.provider';
export { FacebookProvider } from './facebook.provider';
export { GoogleBusinessProvider } from './google-business.provider';
export { InstagramProvider } from './instagram.provider';
export { LinkedInProvider } from './linkedin.provider';
export { TikTokProvider } from './tiktok.provider';
