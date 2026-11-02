import type { BarSeriesType, LineSeriesType } from "@mui/x-charts";

export interface ChartConfig {
  lineSeries: LineSeriesType[];
  barSeries: BarSeriesType[];
  leftAxisLabel: string;
  rightAxisLabel: string;
}

export interface DynamicChartProps {
  title: string;
  dataset: any[];
  chartConfig: ChartConfig;
  loading?: boolean;
  timeRange: string;
  interval: string;
  onTimeRangeChange: (value: string) => void;
  onIntervalChange: (value: string) => void;
  timeRangeOptions: Array<{ value: string; label: string }>;
  intervalOptionsMap: Record<string, string[]>;
  height?: number;
  /** When true the chart stretches to fill its parent's height instead of using a fixed `height`. */
  fill?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  logo?: string;
  logoTooltip?: string;
  customLogoComponent?: React.ReactNode;
  initialHiddenSeries?: Set<string>;
}

export interface ChartDataPoint {
  time: string;
  bucketStartUTC: string;
  [key: string]: any;
}