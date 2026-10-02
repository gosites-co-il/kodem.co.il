import { Permission } from './permission';

/** Workspace and platform roles. Stored values stay the string on the right. */
export const SystemRole = {
  SuperAdmin: 'super_admin',
  Owner: 'owner',
  Admin: 'admin',
  Member: 'member',
  Viewer: 'viewer',
} as const;

export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];

export type RoleName = SystemRole;

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
  [SystemRole.SuperAdmin]: {
    name: SystemRole.SuperAdmin,
    permissions: SUPER_ADMIN_PERMS,
  },
  [SystemRole.Owner]: {
    name: SystemRole.Owner,
    permissions: OWNER_PERMS,
  },
  [SystemRole.Admin]: {
    name: SystemRole.Admin,
    permissions: ADMIN_PERMS,
  },
  [SystemRole.Member]: {
    name: SystemRole.Member,
    permissions: MEMBER_BASE,
  },
  [SystemRole.Viewer]: {
    name: SystemRole.Viewer,
    permissions: [
      'workspace.settings.read',
      'workspace.members.read',
      'insights:read',
      'recommendations:read',
    ],
  },
};

/** Roles offered when inviting members (viewer kept for backward compat only). */
export const INVITABLE_ROLES: RoleName[] = [SystemRole.Admin, SystemRole.Member];

/** Highest → lowest. Used by RoleService.isAtLeast. */
export const ROLE_HIERARCHY: RoleName[] = [
  SystemRole.Viewer,
  SystemRole.Member,
  SystemRole.Admin,
  SystemRole.Owner,
  SystemRole.SuperAdmin,
];
