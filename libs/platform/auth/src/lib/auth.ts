import { Permission, RoleName, ROLE_DEFINITIONS } from '@kodem/contracts';

export interface Session {
  userId: string;
  email: string;
  expiresAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  workspaceId?: string;
  role?: RoleName;
  iat?: number;
  exp?: number;
}

export function hasPermission(role: RoleName, permission: Permission): boolean {
  return ROLE_DEFINITIONS[role].permissions.includes(permission);
}

export function createStubToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
    'base64url',
  );
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 }),
  ).toString('base64url');
  return `${header}.${body}.stub`;
}
