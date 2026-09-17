import type { Permission, RoleName } from '@kodem/contracts';
import { hasPermission as roleHasPermission } from '@kodem/platform/permissions';

/** Fail-closed permission check for UI gating. */
export function can(role: RoleName | null | undefined, permission: Permission) {
  if (!role) return false;
  return roleHasPermission(role, permission);
}
