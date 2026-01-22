import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router";
import Loadable from "./shared/loadable/index.loadable";

//
const AuthProvider = Loadable(lazy(() => import("./provider/auth.provider")));
const NoAuthProvider = Loadable(
  lazy(() => import("./provider/noAuth.provider"))
);
const DashboardProvider = Loadable(
  lazy(() => import("./provider/dashboardLayout.provider"))
);

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import("./layouts/full.layout")));
const DashboardLayout = Loadable(
  lazy(() => import("./layouts/dashboard.layout"))
);

/* ****Pages**** */
const EventsPage = Loadable(lazy(() => import("./pages/events.page")));
const ListingsPage = Loadable(lazy(() => import("./pages/listings.page")));
const SalesPage = Loadable(lazy(() => import("./pages/sales.page")));
const PurchasesPage = Loadable(lazy(() => import("./pages/purchases.page")));
// const ChartsPage = Loadable(lazy(() => import("./pages/charts.page")));

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
        element: <Navigate to="/events" replace />,
      },
      // {
      //   path: "/dashboard",
      //   element: <DashboardPage />,
      // },
      {
        path: "/events",
        element: <EventsPage />,
      },
      {
        path: "/listings",
        element: <ListingsPage />,
      },
      {
        path: "/listings/:eventId",
        element: <ListingsPage />,
      },
      {
        path: "/sales",
        element: <SalesPage />,
      },
      {
        path: "/sales/:eventId",
        element: <SalesPage />,
      },
      {
        path: "/purchases",
        element: <PurchasesPage />,
      },
      // {
      //   path: "/charts",
      //   element: <ChartsPage />,
      // },
      {
        path: "*",
        element: <Navigate to="/events" replace />,
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
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "/auth/signin",
        element: <SignInAuthPage />,
      },
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
];
