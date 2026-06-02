import * as React from "react";
import {
  getDefaultInterval,
  getSmartIntervalForSpan,
  INTERVAL_OPTIONS_MAP,
} from "../shared/constants/components.constants";

export interface UseChartStateReturn {
  timeRange: string;
  interval: string;
  setTimeRange: (value: string) => void;
  setInterval: (value: string) => void;
  /** Push the actual data span (ms) so "all" can auto-select a smart interval. */
  _setDataSpanMs: (ms: number | null) => void;
}

export function useChartState(
  initialTimeRange: string,
  initialInterval?: string,
): UseChartStateReturn {
  const [timeRange, setTimeRange] = React.useState(initialTimeRange);
  const [interval, setInterval] = React.useState(
    initialInterval || getDefaultInterval(initialTimeRange),
  );

  // dataSpanMs is set externally when "all" is active so we can pick a smart interval.
  const [dataSpanMs, setDataSpanMs] = React.useState<number | null>(null);

  // Keep a ref so effects can read the latest value without adding it to deps.
  const dataSpanMsRef = React.useRef(dataSpanMs);
  React.useEffect(() => {
    dataSpanMsRef.current = dataSpanMs;
  }, [dataSpanMs]);

  // When timeRange changes, reset interval.
  // For "all", use the smart interval if span data is already available.
  React.useEffect(() => {
    if (timeRange === "all") {
      const span = dataSpanMsRef.current;
      if (span !== null && span > 0) {
        const options = INTERVAL_OPTIONS_MAP["all"] ?? ["1d", "7d", "30d", "90d"];
        setInterval(getSmartIntervalForSpan(span, options));
      } else {
        setInterval(getDefaultInterval("all"));
      }
    } else {
      setInterval(getDefaultInterval(timeRange));
    }
  }, [timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // When dataSpanMs first arrives (data loaded) and we're still on "all",
  // update the interval. Does NOT fire on manual interval changes.
  React.useEffect(() => {
    if (timeRange !== "all" || dataSpanMs === null || dataSpanMs <= 0) return;
    const options = INTERVAL_OPTIONS_MAP["all"] ?? ["1d", "7d", "30d", "90d"];
    setInterval(getSmartIntervalForSpan(dataSpanMs, options));
  }, [dataSpanMs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrap setTimeRange so switching away from "all" clears the cached span.
  const handleSetTimeRange = React.useCallback((value: string) => {
    if (value !== "all") setDataSpanMs(null);
    setTimeRange(value);
  }, []);

  return {
    timeRange,
    interval,
    setTimeRange: handleSetTimeRange,
    setInterval,
    _setDataSpanMs: setDataSpanMs,
  };
}
