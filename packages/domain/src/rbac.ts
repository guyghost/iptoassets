import type { MemberRole } from "./entities.js";

export const ROLE_HIERARCHY: Record<MemberRole, number> = {
  viewer: 0, attorney: 1, manager: 2, admin: 3,
};

export const PERMISSION_ACTIONS = [
  "asset:read", "asset:create", "asset:update-status", "asset:delete",
  "deadline:read", "deadline:create", "deadline:complete",
  "document:read", "document:create", "document:update-status", "document:delete",
  "portfolio:read", "portfolio:create", "portfolio:modify", "portfolio:delete",
  "bulk:operate", "export:csv", "audit:read",
  "member:invite", "member:change-role", "member:remove", "org:manage",
  "renewal-fee:read", "renewal-fee:write",
  "renewal-decision:read", "renewal-decision:write",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

const MIN_ROLE_FOR_ACTION: Record<PermissionAction, MemberRole> = {
  "asset:read": "viewer", "deadline:read": "viewer", "document:read": "viewer", "portfolio:read": "viewer",
  "asset:create": "attorney", "asset:update-status": "attorney", "asset:delete": "attorney",
  "deadline:create": "attorney", "deadline:complete": "attorney",
  "document:create": "attorney", "document:update-status": "attorney", "document:delete": "attorney",
  "portfolio:create": "manager", "portfolio:modify": "manager", "portfolio:delete": "manager",
  "bulk:operate": "manager", "export:csv": "manager", "audit:read": "manager",
  "member:invite": "admin", "member:change-role": "admin", "member:remove": "admin", "org:manage": "admin",
  "renewal-fee:read": "viewer",
  "renewal-fee:write": "admin",
  "renewal-decision:read": "viewer",
  "renewal-decision:write": "attorney",
};

export function hasPermission(role: MemberRole, action: PermissionAction): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[MIN_ROLE_FOR_ACTION[action]];
}
