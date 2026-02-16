import type { LineSeriesType } from "@mui/x-charts";

// Generate colors for chart series
const CHART_COLORS = [
  "#1976d2", "#ff7043", "#26a69a", "#9c27b0", "#ff9800",
  "#4caf50", "#f44336", "#2196f3", "#ffeb3b", "#e91e63",
];

export const generateSectionLineSeriesConfig = (
  dataset: any[]
): LineSeriesType[] => {
  if (!dataset || dataset.length === 0) return [];

  // Get all section names from the first data point (excluding time and bucketStartUTC)
  const firstPoint = dataset[0];
  const sectionNames = Object.keys(firstPoint).filter(
    (key) => key !== "time" && key !== "bucketStartUTC"
  );

  return sectionNames.map((sectionName, index) => ({
    type: "line" as const,
    label: sectionName,
    dataKey: sectionName,
    color: CHART_COLORS[index % CHART_COLORS.length],
    yAxisId: "leftAxis",
    valueFormatter: (v: any) => (v != null ? `${v}` : "-"),
  }));
};

export const generatePricePointLineSeriesConfig = (
  dataset: any[]
): LineSeriesType[] => {
  if (!dataset || dataset.length === 0) return [];

  // Get all price point keys from the first data point (excluding time and bucketStartUTC)
  const firstPoint = dataset[0];
  const priceKeys = Object.keys(firstPoint).filter(
    (key) => key !== "time" && key !== "bucketStartUTC"
  );

  return priceKeys.map((priceKey, index) => ({
    type: "line" as const,
    label: priceKey,
    dataKey: priceKey,
    color: CHART_COLORS[index % CHART_COLORS.length],
    yAxisId: "leftAxis",
    valueFormatter: (v: any) => (v != null ? `${v}` : "-"),
  }));
};
