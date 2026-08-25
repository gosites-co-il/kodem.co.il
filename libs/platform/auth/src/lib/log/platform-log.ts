/**
 * Thin structured logging helper — no secrets/tokens.
 */
export type LogContext = {
  workspaceId?: string;
  userId?: string;
  requestId?: string;
  module?: string;
  action?: string;
  [key: string]: unknown;
};

const SECRET_KEYS = new Set([
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'secret',
  'jwt',
]);

function scrub(ctx: LogContext): LogContext {
  const out: LogContext = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (SECRET_KEYS.has(k.toLowerCase())) continue;
    if (
      typeof v === 'string' &&
      (k.toLowerCase().includes('token') || k.toLowerCase().includes('secret'))
    ) {
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function platformLog(
  level: 'info' | 'warn' | 'error',
  message: string,
  context: LogContext = {},
): void {
  const payload = { msg: message, ...scrub(context), ts: new Date().toISOString() };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
