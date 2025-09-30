// src/components/dashboard/dashboardHeader.component.tsx
import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiAppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import { Link, useNavigate } from "react-router";
import { useDashboardLayoutContext } from "../../contexts/dashboardLayout.context";
import ThemeSwitcher from "../common/themeSwitcher.common";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout } from "../../store/slices/auth.slice";
import { useAppDispatch } from "../../store/reducers/root.reducer";

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  borderWidth: 0,
  borderBottomWidth: 1,
  borderStyle: "solid",
  borderColor: theme.palette.divider,
  boxShadow: "none",
  zIndex: theme.zIndex.drawer + 1,
}));

const LogoContainer = styled("div")({
  position: "relative",
  height: 40,
  display: "flex",
  alignItems: "center",
  "& img": {
    maxHeight: 40,
  },
});

export interface DashboardHeaderProps {
  logo?: React.ReactNode;
}

export default function DashboardHeader({ logo }: DashboardHeaderProps) {
   const dispatch = useAppDispatch();
  const { isNavigationExpanded, handleToggleHeaderMenu } =
    useDashboardLayoutContext();
  const navigate = useNavigate();

  const handleMenuOpen = React.useCallback(() => {
    handleToggleHeaderMenu(!isNavigationExpanded);
  }, [isNavigationExpanded, handleToggleHeaderMenu]);

  const getMenuIcon = React.useCallback(
    (isExpanded: boolean) => {
      const expandMenuActionText = "Expand";
      const collapseMenuActionText = "Collapse";

      return (
        <Tooltip
          title={`${isExpanded ? collapseMenuActionText : expandMenuActionText} menu`}
          enterDelay={1000}
        >
          <IconButton
            size="small"
            aria-label={`${isExpanded ? collapseMenuActionText : expandMenuActionText} navigation menu`}
            onClick={handleMenuOpen}
          >
            {isExpanded ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>
        </Tooltip>
      );
    },
    [handleMenuOpen]
  );

  return (
    <AppBar
      color="inherit"
      position="absolute"
    >
      <Toolbar>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box>{getMenuIcon(isNavigationExpanded)}</Box>
            <Link to="/" style={{ textDecoration: "none" }}>
              {logo && <LogoContainer>{logo}</LogoContainer>}
            </Link>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <ThemeSwitcher />

            <Tooltip title="Logout">
              <IconButton
                onClick={() => {
                  dispatch(logout()) 
                  navigate("/auth/signin");
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
