import { Permission, RoleName, ROLE_DEFINITIONS } from '@kodem/contracts';

export class RoleService {
  hasPermission(role: RoleName, permission: Permission): boolean {
    return ROLE_DEFINITIONS[role].permissions.includes(permission);
  }

  isAtLeast(role: RoleName, minimum: RoleName): boolean {
    const hierarchy: RoleName[] = ['viewer', 'member', 'admin', 'owner'];
    return hierarchy.indexOf(role) >= hierarchy.indexOf(minimum);
  }

  canManageMembers(role: RoleName): boolean {
    return this.hasPermission(role, 'members:write');
  }

  canAdminWorkspace(role: RoleName): boolean {
    return this.hasPermission(role, 'workspace:admin');
  }
}

export function hasPermission(role: RoleName, permission: Permission): boolean {
  return new RoleService().hasPermission(role, permission);
}
