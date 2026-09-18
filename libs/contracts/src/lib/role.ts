import { Permission } from './permission';

export type RoleName =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'member'
  | 'viewer';

export interface Role {
  name: RoleName;
  permissions: Permission[];
}

const MEMBER_BASE: Permission[] = [
  'workspace.settings.read',
  'workspace.members.read',
  'insights:read',
  'recommendations:read',
  'connections:use',
];

const ADMIN_PERMS: Permission[] = [
  ...MEMBER_BASE,
  'workspace.settings.update',
  'workspace.members.invite',
  'workspace.members.update',
  'workspace.members.remove',
  'workspace.billing.read',
  'connections:manage',
];

const OWNER_PERMS: Permission[] = [
  ...ADMIN_PERMS,
  'workspace.billing.manage',
  'workspace.lifecycle.manage',
];

/** Full permission set — reserved for super_admin. */
const SUPER_ADMIN_PERMS: Permission[] = [...OWNER_PERMS];

export const ROLE_DEFINITIONS: Record<RoleName, Role> = {
  super_admin: {
    name: 'super_admin',
    permissions: SUPER_ADMIN_PERMS,
  },
  owner: {
    name: 'owner',
    permissions: OWNER_PERMS,
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

/** Highest → lowest. Used by RoleService.isAtLeast. */
export const ROLE_HIERARCHY: RoleName[] = [
  'viewer',
  'member',
  'admin',
  'owner',
  'super_admin',
];
