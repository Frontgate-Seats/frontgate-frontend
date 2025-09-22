import React, { useState, useCallback, useRef, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ReactNodeProps } from "../shared/types/node.type";
import { DashboardLayoutContext } from "../contexts/dashboardLayout.context";

const DashboardProvider: React.FC<ReactNodeProps> = ({ children }) => {
  const theme = useTheme();

  const [isDesktopNavigationExpanded, setIsDesktopNavigationExpanded] =
    useState(true);
  const [isMobileNavigationExpanded, setIsMobileNavigationExpanded] =
    useState(false);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);

  const isOverSmViewport = useMediaQuery(theme.breakpoints.up("sm"));
  const isOverMdViewport = useMediaQuery(theme.breakpoints.up("md"));

  const isNavigationExpanded = isOverMdViewport
    ? isDesktopNavigationExpanded
    : isMobileNavigationExpanded;

  const [isFullyExpanded, setIsFullyExpanded] = useState(isNavigationExpanded);
  const [isFullyCollapsed, setIsFullyCollapsed] = useState(
    !isNavigationExpanded
  );

  useEffect(() => {
    if (isNavigationExpanded) {
      const drawerWidthTransitionTimeout = setTimeout(() => {
        setIsFullyExpanded(true);
      }, theme.transitions.duration.enteringScreen);

      return () => clearTimeout(drawerWidthTransitionTimeout);
    }

    setIsFullyExpanded(false);

    return () => {};
  }, [isNavigationExpanded, theme.transitions.duration.enteringScreen]);

  useEffect(() => {
    if (!isNavigationExpanded) {
      const drawerWidthTransitionTimeout = setTimeout(() => {
        setIsFullyCollapsed(true);
      }, theme.transitions.duration.leavingScreen);

      return () => clearTimeout(drawerWidthTransitionTimeout);
    }

    setIsFullyCollapsed(false);

    return () => {};
  }, [isNavigationExpanded, theme.transitions.duration.leavingScreen]);

  const mini = !isNavigationExpanded;

  const setIsNavigationExpanded = useCallback(
    (newExpanded: boolean) => {
      if (isOverMdViewport) {
        setIsDesktopNavigationExpanded(newExpanded);
      } else {
        setIsMobileNavigationExpanded(newExpanded);
      }
    },
    [isOverMdViewport]
  );
  const handleSetSidebarExpanded = useCallback(
    (newExpanded: boolean) => () => {
      setIsNavigationExpanded(newExpanded);
    },
    [setIsNavigationExpanded]
  );

  const handleToggleHeaderMenu = useCallback(
    (isExpanded: boolean) => {
      setIsNavigationExpanded(isExpanded);
    },
    [setIsNavigationExpanded]
  );

  const dashboardLayoutRef = useRef<HTMLDivElement>(null);

  // Existing context fields
  const onPageItemClick = useCallback(
    (itemId: string, hasNestedNavigation: boolean) => {
      if (hasNestedNavigation && !mini) {
        setExpandedItemIds((previousValue) =>
          previousValue.includes(itemId)
            ? previousValue.filter(
                (previousValueItemId) => previousValueItemId !== itemId
              )
            : [...previousValue, itemId]
        );
      } else if (!isOverSmViewport && !hasNestedNavigation) {
        setIsNavigationExpanded(false);
      }
    },
    [mini, setIsNavigationExpanded, isOverSmViewport]
  );

  const hasDrawerTransitions = isOverSmViewport && isOverMdViewport;

  const DashboardLayoutContextValue = {
    onPageItemClick,
    mini,
    fullyExpanded: isDesktopNavigationExpanded,
    fullyCollapsed: !isDesktopNavigationExpanded,

    // new state from layout
    isNavigationExpanded,
    setIsNavigationExpanded,
    handleToggleHeaderMenu,
    dashboardLayoutRef,
    handleSetSidebarExpanded,
    isFullyExpanded,
    isFullyCollapsed,
    expandedItemIds,
    hasDrawerTransitions,
  };

  return (
    <DashboardLayoutContext.Provider value={DashboardLayoutContextValue}>
      {children}
    </DashboardLayoutContext.Provider>
  );
};


export default DashboardProvider;