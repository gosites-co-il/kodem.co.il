import { describe, expect, it } from 'vitest';
import { detectNetwork } from './detect-network';

describe('detectNetwork', () => {
  it('detects instagram', () => {
    expect(detectNetwork('instagram.com/shop')).toBe('instagram');
    expect(detectNetwork('https://www.instagram.com/x')).toBe('instagram');
  });

  it('detects facebook', () => {
    expect(detectNetwork('facebook.com/page')).toBe('facebook');
    expect(detectNetwork('fb.com/page')).toBe('facebook');
  });

  it('detects tiktok', () => {
    expect(detectNetwork('https://www.tiktok.com/@brand')).toBe('tiktok');
  });

  it('falls back to website for other domains', () => {
    expect(detectNetwork('example.co.il')).toBe('website');
  });

  it('returns null for empty / incomplete', () => {
    expect(detectNetwork('')).toBeNull();
    expect(detectNetwork('hello')).toBeNull();
  });
});
