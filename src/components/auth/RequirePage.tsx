import { Navigate } from "react-router";
import { useRole } from "../../hooks/useRole";
import type { PageKey } from "../../configs/permissions";

interface RequirePageProps {
  /** Page key this route maps to. */
  page: PageKey;
  children: React.ReactNode;
}

/**
 * Route guard: renders children only if the current role may access `page`.
 * Otherwise redirects to the role's default landing path. Prevents a
 * fulfillment user from reaching a restricted page by typing its URL.
 */
export default function RequirePage({ page, children }: RequirePageProps) {
  const { canAccess, defaultPath } = useRole();

  if (!canAccess(page)) {
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
}
