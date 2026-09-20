export function marketingOrigin(): string {
  if (typeof window === 'undefined') {
    return process.env['NEXT_PUBLIC_MARKETING_URL'] ?? 'https://kodem.co.il';
  }
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:4321';
  }
  if (host.includes('dev.kodem.co.il')) {
    return 'https://dev.kodem.co.il';
  }
  return 'https://kodem.co.il';
}

export function marketingLegalHref(path: '/terms' | '/privacy' | '/cookies' | '/ai-terms'): string {
  return `${marketingOrigin()}${path}`;
}
