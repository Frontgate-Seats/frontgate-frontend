import * as React from "react";
import { Grid, Card, CardContent, Box, Typography, Stack, Tooltip } from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/reducers/root.reducer";
import { getAvailability, clearAvailability } from "../../store/slices/availability.slice";
import DynamicChart from "../common/charts/DynamicChart";
import { useChartState } from "../../hooks/useChartState";
import { useAvailabilityData } from "../../hooks/useChartData";
import {
  generateSectionLineSeriesConfig,
  generatePricePointLineSeriesConfig,
} from "../../shared/utils/chartConfig.util";
import {
  AVAILABILITY_SECTION_CHART_CONFIG,
  AVAILABILITY_PRICE_CHART_CONFIG,
  INTERVAL_OPTIONS_MAP,
  TIME_RANGE_OPTIONS,
} from "../../shared/constants/components.constants";
import { getPrimaryMarketLogo, getPrimaryMarketLabel } from "../../shared/utils/primaryMarketLogo.util";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvailabilityChartsProps {
  eventId: string;
  /** Height of each individual chart. The component renders two stacked charts. */
  chartHeight?: number;
  /** @deprecated use chartHeight. Kept for backwards compatibility. */
  height?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AvailabilityCharts: React.FC<AvailabilityChartsProps> = ({
  eventId,
  chartHeight,
  height = 240,
}) => {
  const dispatch = useAppDispatch();

  // Resolve per-chart height — prefer chartHeight, fall back to height
  const perChartHeight = chartHeight ?? height;

  const pricePointsChart = useChartState("7d");

  const availabilityFromRedux = useSelector((state: any) => state.availability);

  // Derive primary market logo dynamically from availability data
  const pmMarketType = availabilityFromRedux.data?.pmEvent?.marketType || "";
  const primaryLogo = getPrimaryMarketLogo(pmMarketType);
  const primaryLabel = getPrimaryMarketLabel(pmMarketType);

  const availabilityData = useAvailabilityData(
    availabilityFromRedux.data,
    pricePointsChart.timeRange,
    pricePointsChart.interval,
  );

  const { series: sectionSeries = [], initialHidden: sectionHidden } = React.useMemo(
    () => generateSectionLineSeriesConfig(availabilityData.sectionChart),
    [availabilityData.sectionChart],
  );

  const { series: priceSeries = [], initialHidden: priceHidden } = React.useMemo(
    () => generatePricePointLineSeriesConfig(availabilityData.priceChart),
    [availabilityData.priceChart],
  );

  const sectionChartConfig = React.useMemo(
    () => ({ ...AVAILABILITY_SECTION_CHART_CONFIG, lineSeries: sectionSeries ?? [] }),
    [sectionSeries],
  );

  const priceChartConfig = React.useMemo(
    () => ({ ...AVAILABILITY_PRICE_CHART_CONFIG, lineSeries: priceSeries ?? [] }),
    [priceSeries],
  );

  React.useEffect(() => {
    if (!eventId) return;
    // Always clear stale data and fetch fresh when eventId changes
    dispatch(clearAvailability());
    dispatch(getAvailability({ eventId, lastHoursCount: 8760 })); // 1 year — same as "all" on event details
  }, [dispatch, eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  // If PM data fetch failed, show a static no-data state — don't retry
  if (availabilityFromRedux.error) {
    const NoDataCard = ({ title }: { title: string }) => (
      <Card variant="outlined" sx={{ height: perChartHeight, display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, "&:last-child": { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Tooltip title={primaryLabel}>
              <Box
                component="img"
                src={primaryLogo}
                alt={primaryLabel}
                sx={{ width: 15, height: 15, objectFit: "contain" }}
                onError={(e: any) => { e.currentTarget.style.display = "none"; }}
              />
            </Tooltip>
            <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
          </Stack>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <BarChartIcon sx={{ fontSize: 36, opacity: 0.3, color: "text.disabled" }} />
            <Typography variant="body2" color="text.disabled">No data available</Typography>
          </Box>
        </CardContent>
      </Card>
    );
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}><NoDataCard title="Sections" /></Grid>
        <Grid size={{ xs: 12, md: 6 }}><NoDataCard title="Price Points" /></Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <DynamicChart
          title="Sections"
          dataset={availabilityData.sectionChart}
          chartConfig={sectionChartConfig}
          loading={availabilityFromRedux.loading}
          timeRange={pricePointsChart.timeRange}
          interval={pricePointsChart.interval}
          onTimeRangeChange={pricePointsChart.setTimeRange}
          onIntervalChange={pricePointsChart.setInterval}
          timeRangeOptions={TIME_RANGE_OPTIONS}
          intervalOptionsMap={INTERVAL_OPTIONS_MAP}
          height={perChartHeight}
          initialHiddenSeries={sectionHidden}
          logo={primaryLogo}
          logoTooltip={primaryLabel}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <DynamicChart
          title="Price Points"
          dataset={availabilityData.priceChart}
          chartConfig={priceChartConfig}
          loading={availabilityFromRedux.loading}
          timeRange={pricePointsChart.timeRange}
          interval={pricePointsChart.interval}
          onTimeRangeChange={pricePointsChart.setTimeRange}
          onIntervalChange={pricePointsChart.setInterval}
          timeRangeOptions={TIME_RANGE_OPTIONS}
          intervalOptionsMap={INTERVAL_OPTIONS_MAP}
          height={perChartHeight}
          initialHiddenSeries={priceHidden}
          logo={primaryLogo}
          logoTooltip={primaryLabel}
        />
      </Grid>
    </Grid>
  );
};

export default AvailabilityCharts;
