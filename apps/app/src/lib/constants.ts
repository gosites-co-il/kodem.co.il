import { ENTRY_ROUTES } from '@kodem/contracts';

/** Browser requests use same-origin /api (proxied to Nest in next.config.js). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export const ROUTES = ENTRY_ROUTES;

export const TOKEN_COOKIE = 'kodem_token';

export { ENTRY_ROUTES };
