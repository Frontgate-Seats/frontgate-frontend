import { Navigate, type RouteObject } from "react-router";
import Loadable, { lazyWithRetry } from "./shared/loadable/index.loadable";

const AuthProvider = Loadable(lazyWithRetry(() => import("./provider/auth.provider")));
const NoAuthProvider = Loadable(lazyWithRetry(() => import("./provider/noAuth.provider")));
const DashboardProvider = Loadable(lazyWithRetry(() => import("./provider/dashboardLayout.provider")));

/* ***Layouts**** */
const FullLayout = Loadable(lazyWithRetry(() => import("./layouts/full.layout")));
const DashboardLayout = Loadable(lazyWithRetry(() => import("./layouts/dashboard.layout")));

/* ****Pages**** */
const EventsPage = Loadable(lazyWithRetry(() => import("./pages/events.page")));
const EventDetailsPage = Loadable(lazyWithRetry(() => import("./pages/eventDetails.page")));
const ListingsPage = Loadable(lazyWithRetry(() => import("./pages/listings.page")));
const SalesPage = Loadable(lazyWithRetry(() => import("./pages/sales.page")));
const PurchasesPage = Loadable(lazyWithRetry(() => import("./pages/purchases.page")));
// const SuggestionsPage = Loadable(lazyWithRetry(() => import("./pages/suggestions.page")));
const TradesPage = Loadable(lazyWithRetry(() => import("./pages/trades.page")));
const ListingsMapViewPage = Loadable(lazyWithRetry(() => import("./pages/listingsMapView.page")));

const SignInAuthPage = Loadable(lazyWithRetry(() => import("./pages/auth/signIn.auth.page")));
const AuthCallbackPage = Loadable(lazyWithRetry(() => import("./pages/auth/callback.auth.page")));

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
        element: <ListingsMapViewPage />,
      },
      {
        path: "/listings-map/:event_id",
        element: <ListingsMapViewPage />,
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
      // Suggestions page removed per meeting - June 24, 2026
      // {
      //   path: "/suggestions",
      //   element: <SuggestionsPage />,
      // },
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
  // Standalone — no auth wrapper so NoAuthProvider doesn't interfere
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />,
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
        element: <Navigate to="/events" replace />,
      },
      {
        path: "/auth/signin",
        element: <SignInAuthPage />,
      },
      {
        path: "*",
        element: <Navigate to="/events" replace />,
      },
    ],
  },
];
