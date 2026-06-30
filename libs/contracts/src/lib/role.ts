import { Permission } from './permission';

export type RoleName = 'owner' | 'admin' | 'member' | 'viewer';

export interface Role {
  name: RoleName;
  permissions: Permission[];
}

export const ROLE_DEFINITIONS: Record<RoleName, Role> = {
  owner: {
    name: 'owner',
    permissions: [
      'workspace:read',
      'workspace:write',
      'workspace:admin',
      'members:read',
      'members:write',
      'insights:read',
      'recommendations:read',
      'integrations:manage',
    ],
  },
  admin: {
    name: 'admin',
    permissions: [
      'workspace:read',
      'workspace:write',
      'members:read',
      'members:write',
      'insights:read',
      'recommendations:read',
      'integrations:manage',
    ],
  },
  member: {
    name: 'member',
    permissions: [
      'workspace:read',
      'insights:read',
      'recommendations:read',
    ],
  },
  viewer: {
    name: 'viewer',
    permissions: ['workspace:read', 'insights:read', 'recommendations:read'],
  },
};
