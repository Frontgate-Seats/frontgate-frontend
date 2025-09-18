import Divider from "@mui/material/Divider";
import type {} from "@mui/material/themeCssVarsAugmentation";
import { useDashboardLayoutContext } from "../../contexts/dashboardLayout.context";
import { getDrawerSxTransitionMixin } from "../../shared/utils/mixin.util";

export default function DashboardSidebarDividerItem() {
  const { fullyExpanded, hasDrawerTransitions } = useDashboardLayoutContext();

  return (
    <li>
      <Divider
        sx={{
          borderBottomWidth: 1,
          my: 1,
          mx: -0.5,
          ...(hasDrawerTransitions
            ? getDrawerSxTransitionMixin(fullyExpanded, "margin")
            : {}),
        }}
      />
    </li>
  );
}
