import { createContext, useContext, type RefObject } from "react";

export const DashboardLayoutContext = createContext<{
  onPageItemClick: (id: string, hasNestedNavigation: boolean) => void;
  mini: boolean;
  fullyExpanded: boolean;
  fullyCollapsed: boolean;
  hasDrawerTransitions: boolean;

  // new fields from DashboardProvider
  isNavigationExpanded: boolean;
  setIsNavigationExpanded: (expanded: boolean) => void;
  handleToggleHeaderMenu: (expanded: boolean) => void;
  dashboardLayoutRef: RefObject<HTMLDivElement | null>;
  handleSetSidebarExpanded: (newExpanded: boolean) => void;
  isFullyExpanded: boolean;
  isFullyCollapsed: boolean;
  expandedItemIds: string[];
} | null>(null);


export const useDashboardLayoutContext = () => {
  const context = useContext(DashboardLayoutContext);

  if (!context) {
    throw new Error(
      "useDashboardLayoutContext must be used within an DashboardLayoutProvider"
    );
  }

  return context;
};

export default DashboardLayoutContext;