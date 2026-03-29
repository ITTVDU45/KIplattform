import type { Role, User } from "./auth.types";

const SUPERADMIN_ONLY_PREFIXES = ["/superadmin"];
const ADMIN_PREFIXES = ["/admin"];

function normalizeRole(role: Role): string {
  return String(role).trim().toLowerCase();
}

export function hasAnyRole(
  roles: Role[] | undefined,
  allowedRoles: Role[],
): boolean {
  if (!roles || roles.length === 0) {
    return false;
  }

  const normalizedRoles = new Set(roles.map(normalizeRole));
  return allowedRoles.some((role) => normalizedRoles.has(normalizeRole(role)));
}

export function canAccessPath(
  pathname: string,
  roles: Role[] | undefined,
): boolean {
  if (SUPERADMIN_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return hasAnyRole(roles, ["superadmin"]);
  }

  if (ADMIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return hasAnyRole(roles, ["superadmin", "admin"]);
  }

  return true;
}

export function buildVisibilityScope(user: User | null): {
  isGlobal: boolean;
  assignedUserIds: string[];
} {
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const isGlobal = hasAnyRole(roles, ["superadmin"]);

  return {
    isGlobal,
    assignedUserIds: Array.isArray(user?.assignedUserIds)
      ? user.assignedUserIds
      : [],
  };
}
