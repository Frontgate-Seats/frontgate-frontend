import type { BarSeriesType, LineSeriesType } from "@mui/x-charts";
import type { ChartConfig } from "../types/components.types";

// Sales Meta Chart Configuration
export const SALES_TRENDS_CHART_CONFIG: ChartConfig = {
  lineSeries: [
    {
      type: "line",
      label: "Min Price",
      dataKey: "minPrice",
      color: "#1976d2",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `${v}` : "-"),
    },
    {
      type: "line",
      label: "Average Price",
      dataKey: "averagePrice",
      color: "#ff7043",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `${v}` : "-"),
    },
    {
      type: "line",
      label: "Median Price",
      dataKey: "medianPrice",
      color: "#26a69a",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `${v}` : "-"),
    },
    {
      type: "line",
      label: "Max Price",
      dataKey: "maxPrice",
      color: "#9c27b0",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `${v}` : "-"),
    },
  ] as LineSeriesType[],
  barSeries: [
    {
      type: "bar",
      label: "Total Sales",
      dataKey: "totalSales",
      color: "rgba(76,175,80,0.45)",
      yAxisId: "rightAxis",
    },
    {
      type: "bar",
      label: "Total Units",
      dataKey: "totalUnits",
      color: "rgba(33,150,243,0.45)",
      yAxisId: "rightAxis",
    },
  ] as BarSeriesType[],
  leftAxisLabel: "Price ($)",
  rightAxisLabel: "Sales Count",
};

// Time Range Options (shared across all charts)
export const TIME_RANGE_OPTIONS = [
  { value: "1d", label: "Last Day" },
  { value: "7d", label: "Last Week" },
  { value: "30d", label: "Last Month" },
  { value: "3m", label: "Last 3 Months" },
  { value: "6m", label: "Last 6 Months" },
  { value: "1y", label: "Last Year" },
];

// Interval Options Map (shared across all charts)
export const INTERVAL_OPTIONS_MAP: Record<string, string[]> = {
  "1d": ["1h", "3h", "6h"],
  "7d": ["3h", "6h", "12h", "1d", "3d"],
  "30d": ["12h", "1d", "3d", "7d", "15d"],
  "3m": ["3d", "7d", "30d"],
  "6m": ["7d", "30d", "90d"],
  "1y": ["30d", "90d", "180d"],
};

// Helper function to get default interval for a time range
export const getDefaultInterval = (range: string): string => {
  return INTERVAL_OPTIONS_MAP[range]?.[0] || "1h";
};

// Charts Page Chart Configuration (similar to listings but with different formatting)
export const CHARTS_PAGE_CHART_CONFIG: ChartConfig = {
  lineSeries: [
    {
      type: "line",
      label: "Min Price",
      dataKey: "priceMin",
      color: "#1976d2",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `${v}` : "-"),
    },
    {
      type: "line",
      label: "Min Price 2+",
      dataKey: "twoPlusPriceMin",
      color: "#ff7043",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `${v}` : "-"),
    },
    {
      type: "line",
      label: "GetIn Price Min 2+",
      dataKey: "getInPriceMin",
      color: "#26a69a",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `${v}` : "-"),
    },
  ] as LineSeriesType[],
  barSeries: [
    {
      type: "bar",
      label: "Tickets",
      dataKey: "tickets",
      color: "rgba(144,164,174,0.45)",
      yAxisId: "rightAxis",
      valueFormatter: (v) => (v != null ? `${v}` : "-"),
    },
  ] as BarSeriesType[],
  leftAxisLabel: "Price ($)",
  rightAxisLabel: "Tickets Qty",
};

// Listing Trends Chart Configuration 1 (Short-term view)
export const LISTING_TRENDS_SHORT_CHART_CONFIG: ChartConfig = {
  lineSeries: [
    {
      type: "line",
      label: "Min Price (All)",
      dataKey: "minPriceAll",
      color: "#1976d2",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
    },
    {
      type: "line",
      label: "Min Price (Pair)",
      dataKey: "minPricePair",
      color: "#ff7043",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
    },
    {
      type: "line",
      label: "Median Price (Pair)",
      dataKey: "medianPricePair",
      color: "#26a69a",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
    },
  ] as LineSeriesType[],
  barSeries: [
    {
      type: "bar",
      label: "Ticket Count",
      dataKey: "ticketCount",
      color: "rgba(144,164,174,0.45)",
      yAxisId: "rightAxis",
    },
  ] as BarSeriesType[],
  leftAxisLabel: "Price ($)",
  rightAxisLabel: "Ticket Count",
};

// Listing Trends Chart Configuration 2 (Long-term view)
export const LISTING_TRENDS_LONG_CHART_CONFIG: ChartConfig = {
  lineSeries: [
    {
      type: "line",
      label: "Min Price (All)",
      dataKey: "minPriceAll",
      color: "#1976d2",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
    },
    {
      type: "line",
      label: "Min Price (Pair)",
      dataKey: "minPricePair",
      color: "#ff7043",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
    },
    {
      type: "line",
      label: "Median Price (Pair)",
      dataKey: "medianPricePair",
      color: "#26a69a",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
    },
  ] as LineSeriesType[],
  barSeries: [
    {
      type: "bar",
      label: "Ticket Count",
      dataKey: "ticketCount",
      color: "rgba(144,164,174,0.45)",
      yAxisId: "rightAxis",
    },
  ] as BarSeriesType[],
  leftAxisLabel: "Price ($)",
  rightAxisLabel: "Ticket Count",
};
