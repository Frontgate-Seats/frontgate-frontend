// ROLE / PERMISSION CONFIG
//
// A user's role comes from their Supabase session (app_metadata.role) and is
// mapped to a permission object here — roles are never hardcoded against user
// emails. To add a role, add one entry to `rolePermissions`.

/** Pages the app gates access to. */
export type PageKey = "events" | "inventories" | "recommendations";

export interface RolePermissions {
  /** Can start the purchase (buy) flow. */
  canBuy: boolean;
  /**
   * Can see financial figures (profit, margin, sold price). Hidden for the
   * fulfillment team, who work orders but should not see the money columns.
   */
  canSeeFinancials: boolean;
  /** Which pages this role may see / navigate to. */
  pages: Record<PageKey, boolean>;
  /** Where this role lands by default. */
  defaultPath: string;
}

/**
 * Permissions per role.
 *
 * - admin: full access (buy + every page).
 * - fulfillment: operations team — fulfills sales only. No buying, and Events
 *   / Recommendations are hidden so they stay on the right screens.
 */
export const rolePermissions: Record<string, RolePermissions> = {
  admin: {
    canBuy: true,
    canSeeFinancials: true,
    pages: { events: true, inventories: true, recommendations: true },
    defaultPath: "/inventories",
  },
  fulfillment: {
    canBuy: false,
    canSeeFinancials: false,
    pages: { events: false, inventories: true, recommendations: false },
    defaultPath: "/inventories",
  },
};

/**
 * Role used when a user has no role set. Existing users predate roles, so they
 * must keep full admin access until an admin assigns them something else.
 */
export const DEFAULT_ROLE = "admin";

/** Resolve the permissions for a role, falling back to the default role. */
export function getPermissions(role: unknown): RolePermissions {
  const key = typeof role === "string" && role in rolePermissions ? role : DEFAULT_ROLE;
  return rolePermissions[key];
}
