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
  { value: "1h", label: "Last 1 Hour" },
  { value: "3h", label: "Last 3 Hours" },
  { value: "6h", label: "Last 6 Hours" },
  { value: "12h", label: "Last 12 Hours" },
  { value: "1d", label: "Last Day" },
  { value: "7d", label: "Last Week" },
  { value: "30d", label: "Last Month" },
  { value: "3m", label: "Last 3 Months" },
  { value: "6m", label: "Last 6 Months" },
  { value: "1y", label: "Last Year" },
];

// Interval Options Map (shared across all charts)
export const INTERVAL_OPTIONS_MAP: Record<string, string[]> = {
  "1h": ["5m", "10m", "15m"],
  "3h": ["5m", "10m", "15m", "30m"],
  "6h": ["15m", "30m", "1h"],
  "12h": ["30m", "1h", "2h"],
  "1d": ["1h", "3h", "6h"],
  "7d": ["6h", "12h", "1d", "3d"],
  "30d": ["1d", "3d", "7d", "15d"],
  "3m": ["3d", "7d", "30d"],
  "6m": ["7d", "30d", "90d"],
  "1y": ["14d", "30d", "90d", "180d"],
};

// Helper function to get default interval for a time range
export const getDefaultInterval = (range: string): string => {
  const defaultMap: Record<string, string> = {
    "1h": "5m",
    "3h": "5m",
    "6h": "15m",
    "12h": "30m",
    "1d": "1h",
    "7d": "6h",
    "30d": "1d",
    "3m": "3d",
    "6m": "7d",
    "1y": "14d",
  };
  return defaultMap[range] || "1h";
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

// Primary Market Availability Chart Configuration - Capacity Over Time
export const AVAILABILITY_CHART_CONFIG: ChartConfig = {
  lineSeries: [
    {
      type: "line",
      label: "Available Tickets",
      dataKey: "available",
      color: "#4caf50",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `${v}` : "-"),
    },
    {
      type: "line",
      label: "Sold Tickets",
      dataKey: "sold",
      color: "#f44336",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `${v}` : "-"),
    },
  ] as LineSeriesType[],
  barSeries: [
    {
      type: "bar",
      label: "Sell-Through %",
      dataKey: "sellThroughRate",
      color: "rgba(33,150,243,0.45)",
      yAxisId: "rightAxis",
      valueFormatter: (v) => (v != null ? `${v}%` : "-"),
    },
  ] as BarSeriesType[],
  leftAxisLabel: "Tickets",
  rightAxisLabel: "Sell-Through %",
};

// Primary Market Availability - Section Breakdown (Line Chart - Dynamic)
// Note: Line series will be generated dynamically based on data
export const AVAILABILITY_SECTION_CHART_CONFIG: Omit<
  ChartConfig,
  "lineSeries"
> & { lineSeries: LineSeriesType[] } = {
  lineSeries: [] as LineSeriesType[], // Will be populated dynamically
  barSeries: [] as BarSeriesType[],
  leftAxisLabel: "Available Tickets",
  rightAxisLabel: "",
};

// Primary Market Availability - Price Point Distribution (Line Chart - Dynamic)
// Note: Line series will be generated dynamically based on data
export const AVAILABILITY_PRICE_CHART_CONFIG: Omit<
  ChartConfig,
  "lineSeries"
> & { lineSeries: LineSeriesType[] } = {
  lineSeries: [] as LineSeriesType[], // Will be populated dynamically
  barSeries: [] as BarSeriesType[],
  leftAxisLabel: "Available Tickets",
  rightAxisLabel: "",
};

// Combined Sales Chart Configuration (SeatGeek + Vivid)
export const COMBINED_SALES_CHART_CONFIG: ChartConfig = {
  lineSeries: [
    {
      type: "line",
      label: "SeatGeek Avg Price",
      dataKey: "seatgeekAvgPrice",
      color: "#1976d2",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
    },
    {
      type: "line",
      label: "Vivid Avg Price",
      dataKey: "vividAvgPrice",
      color: "#ff7043",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
    },
  ] as LineSeriesType[],
  barSeries: [
    {
      type: "bar",
      label: "SeatGeek Listings",
      dataKey: "seatgeekListings",
      color: "rgba(25,118,210,0.45)",
      yAxisId: "rightAxis",
    },
    {
      type: "bar",
      label: "Vivid Listings",
      dataKey: "vividListings",
      color: "rgba(255,112,67,0.45)",
      yAxisId: "rightAxis",
    },
  ] as BarSeriesType[],
  leftAxisLabel: "Avg Price ($)",
  rightAxisLabel: "Listings Count",
};
