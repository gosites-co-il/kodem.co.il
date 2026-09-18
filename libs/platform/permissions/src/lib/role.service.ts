import {
  Permission,
  RoleName,
  ROLE_DEFINITIONS,
  ROLE_HIERARCHY,
} from '@kodem/contracts';

export class RoleService {
  hasPermission(role: RoleName, permission: Permission): boolean {
    return ROLE_DEFINITIONS[role].permissions.includes(permission);
  }

  isAtLeast(role: RoleName, minimum: RoleName): boolean {
    return ROLE_HIERARCHY.indexOf(role) >= ROLE_HIERARCHY.indexOf(minimum);
  }

  canManageMembers(role: RoleName): boolean {
    return (
      this.hasPermission(role, 'workspace.members.invite') ||
      this.hasPermission(role, 'workspace.members.update') ||
      this.hasPermission(role, 'workspace.members.remove')
    );
  }

  canAdminWorkspace(role: RoleName): boolean {
    return this.hasPermission(role, 'workspace.lifecycle.manage');
  }
}

export function hasPermission(role: RoleName, permission: Permission): boolean {
  return new RoleService().hasPermission(role, permission);
}
