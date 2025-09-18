import { lazy } from "react";
import type { RouteObject } from "react-router";
import Loadable from "./shared/loadable/index.loadable";
import { DashboardProvider } from "./provider/dashboardLayout.provider";

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
      <DashboardProvider>
        <DashboardLayout />
      </DashboardProvider>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "/dasboard",
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: "/auth",
    element: <FullLayout />,
    children: [
      {
        index: true,
        element: <SignInAuthPage />,
      },
      {
        path: "/auth/signIn",
        element: <SignInAuthPage />,
      },
    ],
  },
];
