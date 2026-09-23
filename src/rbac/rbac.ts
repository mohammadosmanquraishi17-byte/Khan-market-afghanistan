export const ROLE_DEFINITIONS = {
  USER: ['ai.use'],
  SELLER: ['ai.use', 'ai.view_usage'],
  ADMIN: ['ai.use', 'ai.manage', 'ai.view_usage', 'ai.manage_providers', 'system.admin'],
  OWNER: ['ai.use', 'ai.manage', 'ai.view_usage', 'ai.manage_providers', 'system.admin'],
} as const;

export type RoleName = keyof typeof ROLE_DEFINITIONS;
export type PermissionName = (typeof ROLE_DEFINITIONS)[RoleName][number];

export function getRolePermissions(role: string): string[] {
  return ROLE_DEFINITIONS[role as RoleName] ?? [];
}

export function userHasPermission(userRoles: string[] | undefined, permission: string): boolean {
  for (const role of userRoles ?? []) {
    const permissions = getRolePermissions(role);
    if (permissions.includes(permission)) {
      return true;
    }
  }

  return false;
}

export function getDefaultRole(): string {
  return process.env.DEFAULT_USER_ROLE ?? 'USER';
}

export function canAssignRole(targetRole: string, requestedRole: string): boolean {
  if (targetRole === requestedRole) {
    return false;
  }

  return ['ADMIN', 'OWNER'].includes(requestedRole);
}

export function requirePermission(userRoles: string[] | undefined, permission: string): boolean {
  return userHasPermission(userRoles, permission);
}
