import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router";
import Loadable from "./shared/loadable/index.loadable";
import { DashboardProvider } from "./provider/dashboardLayout.provider";
import { AuthProvider } from "./provider/auth.provider";
import { NoAuthProvider } from "./provider/noAuth.provider";

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import("./layouts/full.layout")));
const DashboardLayout = Loadable(
  lazy(() => import("./layouts/dashboard.layout"))
);

/* ****Pages**** */
const DashboardPage = Loadable(lazy(() => import("./pages/dashboard.page")));
const SignInAuthPage = Loadable(
  lazy(() => import("./pages/auth/signIn.auth.page"))
);

export const route: RouteObject[] = [
  {
    path: "/",
    element: (
      <AuthProvider>
        <DashboardProvider>
          <DashboardLayout />
        </DashboardProvider>
      </AuthProvider>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "/dashboard", // ✅ fixed
        element: <DashboardPage />,
      },
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
  {
    path: "/auth",
    element: (
      <NoAuthProvider>
        <FullLayout />
      </NoAuthProvider>
    ),
    children: [
      {
        index: true,
        element: <SignInAuthPage />,
      },
      {
        path: "/auth/signIn",
        element: <SignInAuthPage />,
      },
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
];
