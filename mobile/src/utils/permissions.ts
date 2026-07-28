import type { User, UserRole } from '../types/api';

/**
 * Role / permission helpers for mobile.
 * Prefer server-provided `user.permissions` from GET /api/auth/me.
 */

export function hasRole(
  userOrRole: User | UserRole | null | undefined,
  targetRole: UserRole | UserRole[],
): boolean {
  const role =
    typeof userOrRole === 'string'
      ? userOrRole
      : userOrRole?.role ?? null;

  if (!role) return false;

  if (Array.isArray(targetRole)) {
    return targetRole.includes(role);
  }

  return role === targetRole;
}

export function hasPermission(
  user: User | null | undefined,
  permission: string,
): boolean {
  if (!user || !permission) return false;

  if (Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }

  return false;
}

export function hasAnyPermission(
  user: User | null | undefined,
  permissions: string[],
): boolean {
  if (!user || !permissions?.length) return false;
  return permissions.some((p) => hasPermission(user, p));
}

export function hasAllPermissions(
  user: User | null | undefined,
  permissions: string[],
): boolean {
  if (!user || !permissions?.length) return false;
  return permissions.every((p) => hasPermission(user, p));
}
