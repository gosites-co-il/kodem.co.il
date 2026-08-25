import { Permission } from './permission';

export type RoleName = 'owner' | 'admin' | 'member' | 'viewer';

export interface Role {
  name: RoleName;
  permissions: Permission[];
}

const MEMBER_BASE: Permission[] = [
  'workspace.settings.read',
  'workspace.members.read',
  'insights:read',
  'recommendations:read',
];

const ADMIN_PERMS: Permission[] = [
  ...MEMBER_BASE,
  'workspace.settings.update',
  'workspace.members.invite',
  'workspace.members.update',
  'workspace.members.remove',
  'workspace.billing.read',
  'integrations:manage',
];

export const ROLE_DEFINITIONS: Record<RoleName, Role> = {
  owner: {
    name: 'owner',
    permissions: [
      ...ADMIN_PERMS,
      'workspace.billing.manage',
      'workspace.lifecycle.manage',
    ],
  },
  admin: {
    name: 'admin',
    permissions: ADMIN_PERMS,
  },
  member: {
    name: 'member',
    permissions: MEMBER_BASE,
  },
  viewer: {
    name: 'viewer',
    permissions: [
      'workspace.settings.read',
      'workspace.members.read',
      'insights:read',
      'recommendations:read',
    ],
  },
};

/** Roles offered when inviting members (viewer kept for backward compat only). */
export const INVITABLE_ROLES: RoleName[] = ['admin', 'member'];
