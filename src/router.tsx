import { Navigate, type RouteObject } from "react-router";
import Loadable, { lazyWithRetry } from "./shared/loadable/index.loadable";
import RequirePage from "./components/auth/RequirePage";

const AuthProvider = Loadable(lazyWithRetry(() => import("./provider/auth.provider")));
const NoAuthProvider = Loadable(lazyWithRetry(() => import("./provider/noAuth.provider")));
const DashboardProvider = Loadable(lazyWithRetry(() => import("./provider/dashboardLayout.provider")));

/* ***Layouts**** */
const FullLayout = Loadable(lazyWithRetry(() => import("./layouts/full.layout")));
const DashboardLayout = Loadable(lazyWithRetry(() => import("./layouts/dashboard.layout")));

/* ****Pages**** */
const DashboardPage = Loadable(lazyWithRetry(() => import("./pages/dashboard.page")));
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
        element: <Navigate to="/inventories" replace />,
      },
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/events",
        element: (
          <RequirePage page="events">
            <EventsPage />
          </RequirePage>
        ),
      },
      {
        path: "/events/:eventId",
        element: (
          <RequirePage page="events">
            <EventDetailsPage />
          </RequirePage>
        ),
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
        path: "/inventories",
        element: <PurchasesPage />,
      },
      // Suggestions page removed per meeting - June 24, 2026
      // {
      //   path: "/suggestions",
      //   element: <SuggestionsPage />,
      // },
      {
        path: "/recommendations",
        element: (
          <RequirePage page="recommendations">
            <TradesPage />
          </RequirePage>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/inventories" replace />,
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
        element: <Navigate to="/inventories" replace />,
      },
      {
        path: "/auth/signin",
        element: <SignInAuthPage />,
      },
      {
        path: "*",
        element: <Navigate to="/inventories" replace />,
      },
    ],
  },
];
