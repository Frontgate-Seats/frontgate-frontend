import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { Outlet } from "react-router";
import { Stack } from "@mui/material";

import DashboardHeader from "../components/dashboard/header.dashboard";
import DashboardSidebar from "../components/dashboard/sidebar.dashboard";
import { useDashboardLayoutContext } from "../contexts/dashboardLayout.context";

export default function DashboardLayout() {
  const { dashboardLayoutRef } = useDashboardLayoutContext();

  return (
    <Stack
      ref={dashboardLayoutRef}
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <DashboardHeader logo={<></>} title="FrontGate" />
      <DashboardSidebar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
        }}
      >
        <Toolbar sx={{ displayPrint: "none" }} />
        <Box
          component="main"
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Stack>
  );
}
