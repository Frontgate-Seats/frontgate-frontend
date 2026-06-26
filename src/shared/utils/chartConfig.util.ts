import type { LineSeriesType } from "@mui/x-charts";

// Generate colors for chart series
const CHART_COLORS = [
  "#1976d2", "#ff7043", "#26a69a", "#9c27b0", "#ff9800",
  "#4caf50", "#f44336", "#2196f3", "#ffeb3b", "#e91e63",
];

// Maximum number of series to show by default (top sections/price points)
const MAX_SERIES = 5;

// Generate section series - returns ALL series, top 5 visible by default
export const generateSectionLineSeriesConfig = (
  dataset: any[]
): { series: LineSeriesType[]; initialHidden: Set<string> } => {
  if (!dataset || dataset.length === 0) return { series: [], initialHidden: new Set() };

  // Get all section names from the first data point (excluding time and bucketStartUTC)
  const firstPoint = dataset[0];
  const sectionNames = Object.keys(firstPoint).filter(
    (key) => key !== "time" && key !== "bucketStartUTC"
  );

  if (sectionNames.length === 0) return { series: [], initialHidden: new Set() };

  // Calculate total availability for each section
  const totals: Record<string, number> = {};
  sectionNames.forEach((sectionName) => {
    totals[sectionName] = dataset.reduce((sum, pt) => sum + (pt[sectionName] ?? 0), 0);
  });

  // Sort by total availability descending
  const sortedSections = sectionNames.sort((a, b) => totals[b] - totals[a]);

  // Top 5 are visible, rest are initially hidden
  const visibleSections = sortedSections.slice(0, MAX_SERIES);
  const allHidden = new Set<string>(sectionNames.filter(s => !visibleSections.includes(s)));

  const series: LineSeriesType[] = sortedSections.map((sectionName, index) => ({
    type: "line" as const,
    label: sectionName,
    dataKey: sectionName,
    color: CHART_COLORS[index % CHART_COLORS.length],
    yAxisId: "leftAxis",
    valueFormatter: (v: any) => (v != null ? `${v}` : "-"),
  }));

  return { series, initialHidden: allHidden };
};

// Generate price point series - returns ALL series, top 5 visible by default
export const generatePricePointLineSeriesConfig = (
  dataset: any[]
): { series: LineSeriesType[]; initialHidden: Set<string> } => {
  if (!dataset || dataset.length === 0) return { series: [], initialHidden: new Set() };

  // Get all price point keys from the first data point (excluding time and bucketStartUTC)
  const firstPoint = dataset[0];
  const priceKeys = Object.keys(firstPoint).filter(
    (key) => key !== "time" && key !== "bucketStartUTC"
  );

  if (priceKeys.length === 0) return { series: [], initialHidden: new Set() };

  // Calculate total availability for each price point
  const totals: Record<string, number> = {};
  priceKeys.forEach((priceKey) => {
    totals[priceKey] = dataset.reduce((sum, pt) => sum + (pt[priceKey] ?? 0), 0);
  });

  // Sort by total availability descending
  const sortedPrices = priceKeys.sort((a, b) => totals[b] - totals[a]);

  // Top 5 are visible, rest are initially hidden
  const visiblePrices = sortedPrices.slice(0, MAX_SERIES);
  const allHidden = new Set<string>(priceKeys.filter(p => !visiblePrices.includes(p)));

  const series: LineSeriesType[] = sortedPrices.map((priceKey, index) => ({
    type: "line" as const,
    label: priceKey,
    dataKey: priceKey,
    color: CHART_COLORS[index % CHART_COLORS.length],
    yAxisId: "leftAxis",
    valueFormatter: (v: any) => (v != null ? `${v}` : "-"),
  }));

  return { series, initialHidden: allHidden };
};
