import { lazy } from "react";
import type { RouteObject } from "react-router";

/* ***Layouts**** */
const FullLayout = lazy(() => import("./layouts/full.layout"));

/* ****Pages**** */
const DashboardPage = lazy(() => import("./pages/dashboard.page"));
const SignInAuthPage = lazy(() => import("./pages/auth/signIn.auth.page"));


export const route: RouteObject[] = [
  {
    path: "/",
    element: <FullLayout />, 
    children: [
      {
        index: true,
        element: <DashboardPage />, 
      },
      {
        path: "signin",
        element: <SignInAuthPage />, 
      },
    ],
  },
];

