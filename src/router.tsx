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
const EventDetailsPage = Loadable(lazy(() => import("./pages/eventDetails.page")));
const ListingsPage = Loadable(lazy(() => import("./pages/listings.page")));
const SalesPage = Loadable(lazy(() => import("./pages/sales.page")));
const PurchasesPage = Loadable(lazy(() => import("./pages/purchases.page")));
const SuggestionsPage = Loadable(lazy(() => import("./pages/suggestions.page")));
const TradesPage = Loadable(lazy(() => import("./pages/trades.page")));

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
      {
        path: "/events",
        element: <EventsPage />,
      },
      {
        path: "/events/:eventId",
        element: <EventDetailsPage />,
      },
      {
        path: "/listings",
        element: <ListingsPage />,
      },
      {
        path: "/listings/:event_id",
        element: <ListingsPage />,
      },
      {
        path: "/sales",
        element: <SalesPage />,
      },
      {
        path: "/sales/:event_id",
        element: <SalesPage />,
      },
      {
        path: "/purchases",
        element: <PurchasesPage />,
      },
      {
        path: "/suggestions",
        element: <SuggestionsPage />,
      },
      {
        path: "/trades",
        element: <TradesPage />,
      },
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
