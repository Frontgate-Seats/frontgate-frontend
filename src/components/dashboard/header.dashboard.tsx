import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiAppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import Stack from "@mui/material/Stack";
import { Link, useNavigate } from "react-router";
import { useDashboardLayoutContext } from "../../contexts/dashboardLayout.context";
import ThemeSwitcher from "../common/themeSwitcher.common";
import LogoutIcon from '@mui/icons-material/Logout';

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  borderWidth: 0,
  borderBottomWidth: 1,
  borderStyle: "solid",
  borderColor: (theme.vars ?? theme).palette.divider,
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
  title?: string;
}

export default function DashboardHeader({ logo, title }: DashboardHeaderProps) {
  const theme = useTheme();
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
          title={`${isExpanded ? collapseMenuActionText : expandMenuActionText
            } menu`}
          enterDelay={1000}
        >
          <IconButton
            size="small"
            aria-label={`${isExpanded ? collapseMenuActionText : expandMenuActionText
              } navigation menu`}
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
    <AppBar color="inherit" position="absolute" sx={{ displayPrint: "none" }}>
      <Toolbar sx={{ backgroundColor: "inherit", mx: { xs: -0.75, sm: -1 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <Stack direction="row" alignItems="center">
            <Box sx={{ mr: 1 }}>{getMenuIcon(isNavigationExpanded)}</Box>
            <Link to="/" style={{ textDecoration: "none" }}>
              <Stack direction="row" alignItems="center">
                {logo ? <LogoContainer>{logo}</LogoContainer> : null}
              </Stack>
            </Link>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ marginLeft: 'auto' }}
          >
            <Stack direction="row" alignItems="center">
              <ThemeSwitcher />
            </Stack>

            <Stack direction="row" alignItems="center">
              <Tooltip title="Logout">
                <IconButton
                  onClick={() => {
                    localStorage.clear();       // clear all local storage
                    navigate("/auth/signIn");         // redirect to login page
                  }}
                >
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Stack>

          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
