export type Permission =
  | 'workspace:read'
  | 'workspace:write'
  | 'workspace:admin'
  | 'members:read'
  | 'members:write'
  | 'insights:read'
  | 'recommendations:read'
  | 'integrations:manage';

export const ALL_PERMISSIONS: Permission[] = [
  'workspace:read',
  'workspace:write',
  'workspace:admin',
  'members:read',
  'members:write',
  'insights:read',
  'recommendations:read',
  'integrations:manage',
];
