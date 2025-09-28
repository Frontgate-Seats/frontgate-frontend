import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { Outlet } from "react-router";
import { Stack } from "@mui/material";

import DashboardHeader from "../components/dashboard/header.dashboard";
import DashboardSidebar from "../components/dashboard/sidebar.dashboard";
import { useDashboardLayoutContext } from "../contexts/dashboardLayout.context";
import FrontGateLogoBlack from "../assets/img/frontgate_logo_black.png";
import FrontGateLogoWhite from "../assets/img/frontgate_logo_white.png";
import { useColorScheme, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from "../shared/constants/layout.constant";

export default function DashboardLayout() {
  const { dashboardLayoutRef, mini } = useDashboardLayoutContext();
  const { mode } = useColorScheme();
  const theme = useTheme();

  const isMobile = !useMediaQuery(theme.breakpoints.up("md"));
  const sidebarWidth = isMobile ? 0 : mini ? MINI_DRAWER_WIDTH : DRAWER_WIDTH;

  return (
    <Stack
      ref={dashboardLayoutRef}
      sx={{
        height: "100%",
        width: "100%",
        bgcolor: "background.default",
      }}
    >
      <DashboardHeader
        logo={
          <img
            src={mode === "dark" ? FrontGateLogoWhite : FrontGateLogoBlack}
            alt="Frontgate Logo"
          />
        }
      />

      {/* Flex row: Sidebar + Main content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        {/* Sidebar with exact width */}
        <Box
          sx={{
            width: sidebarWidth,
            transition: "width 0.3s ease",
            flexShrink: 0,
          }}
        >
          <DashboardSidebar />
        </Box>

        {/* Main content */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          <Toolbar sx={{ displayPrint: "none" }} />
          <Outlet />
        </Box>
      </Box>
    </Stack>
  );
}
