import { lazy } from "react";
import type { RouteObject } from "react-router";
import Loadable from "./shared/loadable/index.loadable";

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import("./layouts/full.layout")));

/* ****Pages**** */
const DashboardPage = Loadable(lazy(() => import("./pages/dashboard.page")));
const SignInAuthPage = Loadable(lazy(() => import("./pages/auth/signIn.auth.page")));


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

