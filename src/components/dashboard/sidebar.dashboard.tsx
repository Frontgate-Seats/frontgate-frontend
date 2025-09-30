import { Fragment, useCallback } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Toolbar from "@mui/material/Toolbar";
import { matchPath, useLocation } from "react-router";
import EventIcon from "@mui/icons-material/Event";
import ListIcon from "@mui/icons-material/List";

import {
  getDrawerSxTransitionMixin,
  getDrawerWidthTransitionMixin,
} from "../../shared/utils/mixin.util";
import {
  DRAWER_WIDTH,
  MINI_DRAWER_WIDTH,
} from "../../shared/constants/layout.constant";

import DashboardSidebarHeaderItem from "./headerItem.dashboard";
import DashboardSidebarPageItem from "./pageItem.dashboard";
import { useDashboardLayoutContext } from "../../contexts/dashboardLayout.context";

export default function DashboardSidebar() {
  const { pathname } = useLocation();

  const {
    mini,
    handleSetSidebarExpanded,
    isNavigationExpanded,
    isFullyExpanded,
    expandedItemIds,
    hasDrawerTransitions,
    dashboardLayoutRef,
  } = useDashboardLayoutContext();

  // Calculate drawer width
  const drawerWidth = mini ? MINI_DRAWER_WIDTH : DRAWER_WIDTH;

  // Drawer content generator
  const getDrawerContent = useCallback(
    (viewport: "phone" | "tablet" | "desktop") => (
      <Fragment>
        <Toolbar />
        <Box
          component="nav"
          aria-label={`${
            viewport.charAt(0).toUpperCase() + viewport.slice(1)
          } navigation`}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "auto",
            overflowX: "hidden",
            pt: mini ? 2 : 0,
            scrollbarGutter: mini ? "stable" : "auto",
            ...(hasDrawerTransitions
              ? getDrawerSxTransitionMixin(isFullyExpanded, "padding")
              : {}),
          }}
        >
          <List
            dense
            sx={{
              width: mini ? MINI_DRAWER_WIDTH : "auto",
              padding: mini ? 0 : 0.5,
              mb: 4,
            }}
          >
            <DashboardSidebarHeaderItem>Main</DashboardSidebarHeaderItem>

            {/* <DashboardSidebarPageItem
              id="dashboard"
              title="Dashboard"
              icon={<DashboardIcon />}
              href="/dashboard"
              selected={!!matchPath("/dashboard/*", pathname) || pathname === "/"}
            /> */}

            <DashboardSidebarPageItem
              id="events"
              title="Events"
              icon={<EventIcon />}
              href="/events"
              selected={
                !!matchPath("/events/*", pathname) || pathname === "/events"
              }
            />
            <DashboardSidebarPageItem
              id="listings"
              title="Listings"
              icon={<ListIcon />}
              href="/listings"
              selected={
                !!matchPath("/listings/*", pathname) || pathname === "/events"
              }
            />
          </List>
        </Box>
      </Fragment>
    ),
    [mini, hasDrawerTransitions, isFullyExpanded, expandedItemIds, pathname]
  );

  // Drawer shared styles
  const getDrawerSharedSx = useCallback(
    (isTemporary: boolean) => ({
      displayPrint: "none",
      width: drawerWidth,
      flexShrink: 0,
      ...getDrawerWidthTransitionMixin(isNavigationExpanded),
      ...(isTemporary ? { position: "absolute" } : {}),
      [`& .MuiDrawer-paper`]: {
        position: "absolute",
        width: drawerWidth,
        boxSizing: "border-box",
        backgroundImage: "none",
        ...getDrawerWidthTransitionMixin(isNavigationExpanded),
      },
    }),
    [drawerWidth, isNavigationExpanded]
  );

  return (
    <>
      {/* MOBILE DRAWER */}
      <Drawer
        container={dashboardLayoutRef?.current}
        variant="temporary"
        open={isNavigationExpanded}
        onClose={() => handleSetSidebarExpanded(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          ...getDrawerSharedSx(true),
        }}
      >
        {getDrawerContent("phone")}
      </Drawer>

      {/* TABLET DRAWER */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block", md: "none" },
          ...getDrawerSharedSx(false),
        }}
      >
        {getDrawerContent("tablet")}
      </Drawer>

      {/* DESKTOP DRAWER */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          ...getDrawerSharedSx(false),
        }}
      >
        {getDrawerContent("desktop")}
      </Drawer>
    </>
  );
}
