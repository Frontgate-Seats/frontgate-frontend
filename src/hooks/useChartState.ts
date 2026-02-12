import * as React from "react";
import { getDefaultInterval } from "../shared/constants/components.constants";

interface UseChartStateReturn {
  timeRange: string;
  interval: string;
  setTimeRange: (value: string) => void;
  setInterval: (value: string) => void;
}

export function useChartState(
  initialTimeRange: string,
  initialInterval?: string
): UseChartStateReturn {
  const [timeRange, setTimeRange] = React.useState(initialTimeRange);
  const [interval, setInterval] = React.useState(
    initialInterval || getDefaultInterval(initialTimeRange)
  );

  React.useEffect(() => {
    setInterval(getDefaultInterval(timeRange));
  }, [timeRange]);

  return {
    timeRange,
    interval,
    setTimeRange,
    setInterval,
  };
}
