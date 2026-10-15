import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { getPermissions, type PageKey } from "../configs/permissions";

/**
 * Reads the current user's role from the Supabase session (app_metadata.role)
 * and exposes what that role is allowed to do. The role is set by an admin via
 * the service role, travels inside the session JWT, and so needs no extra
 * network call here.
 */
export function useRole() {
  const user = useSelector((state: RootState) => state.auth.user) as
    | { app_metadata?: { role?: unknown } }
    | null;

  return useMemo(() => {
    const permissions = getPermissions(user?.app_metadata?.role);
    return {
      canBuy: permissions.canBuy,
      canSeeFinancials: permissions.canSeeFinancials,
      defaultPath: permissions.defaultPath,
      canAccess: (page: PageKey) => permissions.pages[page],
    };
  }, [user]);
}

export default useRole;
