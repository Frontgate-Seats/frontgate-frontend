import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { Outlet } from "react-router";
import { Stack } from "@mui/material";

import DashboardHeader from "../components/dashboard/header.dashboard";
import DashboardSidebar from "../components/dashboard/sidebar.dashboard";
import { useDashboardLayoutContext } from "../contexts/dashboardLayout.context";
import FrontGateLogoBlack from "../assets/img/frontgate_logo_black.png";
import FrontGateLogoWhite from "../assets/img/frontgate_logo_white.png";
import { useColorScheme } from "@mui/material/styles";
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from "../shared/constants/layout.constant";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function DashboardLayout() {
  const { dashboardLayoutRef, mini } = useDashboardLayoutContext();
  const { mode } = useColorScheme();
  const theme = useTheme();

  const isMobile = !useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Stack
      ref={dashboardLayoutRef}
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
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
      <DashboardSidebar />
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          // Animate paddingLeft when sidebar toggles
          paddingLeft: isMobile
            ? 0
            : `${mini ? MINI_DRAWER_WIDTH : DRAWER_WIDTH}px`,
          transition: "padding-left 0.3s ease", // ✅ Smooth animation
        }}
      >
        <Toolbar sx={{ displayPrint: "none" }} />
        <Outlet />
      </Box>
    </Stack>
  );
}
