/** Browser requests use same-origin /api (proxied to Nest in next.config.js). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export const ROUTES = {
  login: '/login',
  register: '/register',
  callback: '/auth/callback',
  workspaceSelect: '/workspace/select',
  dashboard: '/dashboard',
} as const;

export const TOKEN_COOKIE = 'kodem_token';
