import * as React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import {
  ChartDataProvider,
  ChartsSurface,
  ChartsGrid,
  ChartsTooltip,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  BarPlot,
  MarkPlot,
  ChartsLegend,
} from "@mui/x-charts";
import { parseChartTime } from "../../../shared/utils/dateTime.util";
import type { DynamicChartProps } from "../../../shared/types/components.types";
import ToggleFullscreen from "../ToggleFullscreen";

const DynamicChart: React.FC<DynamicChartProps> = ({
  title,
  dataset,
  chartConfig,
  loading = false,
  timeRange,
  interval,
  onTimeRangeChange,
  onIntervalChange,
  timeRangeOptions,
  intervalOptionsMap,
  height = 400,
  logo,
  customLogoComponent,
  initialHiddenSeries,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [hiddenSeries, setHiddenSeries] = React.useState<Set<string>>(
    initialHiddenSeries ?? new Set(),
  );

  // Re-apply initial hidden series whenever the set reference changes
  // (e.g. when dataset is recomputed and new series keys are determined)
  React.useEffect(() => {
    setHiddenSeries(initialHiddenSeries ?? new Set());
  }, [initialHiddenSeries]);

  const { lineSeries = [], barSeries = [], leftAxisLabel, rightAxisLabel } = chartConfig ?? {};

  const handleFullscreenChange = (fullscreenMode: boolean) => {
    setIsFullscreen(fullscreenMode);
  };

  // Apply hidden state to all series
  const processedLineSeries = lineSeries.map((series, index) => ({
    ...series,
    id: series.dataKey || series.id || `line-${index}`,
  }));

  const processedBarSeries = barSeries.map((series, index) => ({
    ...series,
    id: series.dataKey || series.id || `bar-${index}`,
  }));

  // All series for legend
  const allSeries = [...processedLineSeries, ...processedBarSeries];

  // Get visible series IDs for multi-select
  const visibleSeriesIds = allSeries
    .filter((series) => !hiddenSeries.has(String(series.id)))
    .map((series) => String(series.id));

  const handleSeriesToggle = (event: any) => {
    const selectedIds = event.target.value as string[];
    const allIds = allSeries.map((s) => String(s.id));
    
    // Calculate which series should be hidden
    const newHiddenSeries = new Set(
      allIds.filter((id) => !selectedIds.includes(id))
    );
    
    setHiddenSeries(newHiddenSeries);
  };

  // Filter out hidden series completely
  const visibleLineSeries = processedLineSeries.filter(
    (series) => series.id && !hiddenSeries.has(series.id as string),
  );
  const visibleBarSeries = processedBarSeries.filter(
    (series) => series.id && !hiddenSeries.has(series.id as string),
  );

  // ── Empty / no-data state ─────────────────────────────────────────────────
  const hasData = dataset && dataset.length > 0;
  const showEmptyState = !loading && !hasData;

  if (showEmptyState) {
    return (
      <ToggleFullscreen onFullscreenChange={handleFullscreenChange}>
        <Card
          variant="outlined"
          sx={{
            height: isFullscreen ? "100%" : `${height}px`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <CardContent
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Title row */}
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }} flexWrap="wrap">
              <Stack direction="row" alignItems="center" spacing={1}>
                {customLogoComponent ? (
                  customLogoComponent
                ) : logo ? (
                  <Box
                    component="img"
                    src={logo}
                    alt="Logo"
                    sx={{ width: 24, height: 24, objectFit: "contain" }}
                  />
                ) : null}
                <Typography variant="h6" fontWeight={600}>
                  {title}
                </Typography>
              </Stack>
            </Stack>

            {/* Centered prompt */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                color: "text.disabled",
              }}
            >
              <BarChartIcon sx={{ fontSize: 40, opacity: 0.35 }} />
              <Typography variant="body2" color="text.disabled">
                No availability data
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </ToggleFullscreen>
    );
  }

  return (
    <ToggleFullscreen onFullscreenChange={handleFullscreenChange}>
      <Card
        variant="outlined"
        sx={{
          height: isFullscreen ? "100%" : `${height}px`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent
          sx={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            p: height < 250 ? 1 : 2,
            "&:last-child": { pb: height < 250 ? 1 : 2 },
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mb: height < 250 ? 0.5 : 1.5, gap: 1 }}
            flexWrap="wrap"
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              {customLogoComponent ? (
                customLogoComponent
              ) : logo ? (
                <Tooltip
                  title={
                    logo.includes("tj-logo")
                      ? "TicketJockey"
                      : logo.includes("vivid-logo")
                        ? "Vivid Seats"
                        : logo.includes("seatgeek-logo")
                          ? "SeatGeek"
                          : ""
                  }
                >
                  <Box
                    component="img"
                    src={logo}
                    alt="Logo"
                    sx={{
                      width: 24,
                      height: 24,
                      objectFit: "contain",
                    }}
                  />
                </Tooltip>
              ) : null}
              <Typography variant="subtitle2" fontWeight={600}>
                {title}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {/* Series Selector */}
              {allSeries.length > 0 && (
                <FormControl size="small">
                  <InputLabel sx={{ fontSize: "0.72rem" }}>Series</InputLabel>
                  <Select
                    multiple
                    value={visibleSeriesIds}
                    onChange={handleSeriesToggle}
                    input={<OutlinedInput label="Series" />}
                    renderValue={(selected) => `${selected.length} selected`}
                    sx={{ minWidth: 110, fontSize: "0.72rem", "& .MuiSelect-select": { py: "4px" } }}
                  >
                    {allSeries.map((series) => {
                      const seriesId = String(series.id || "");
                      const label =
                        typeof series.label === "function"
                          ? series.label("legend")
                          : series.label || seriesId;

                      return (
                        <MenuItem key={seriesId} value={seriesId}>
                          <Checkbox
                            checked={visibleSeriesIds.includes(seriesId)}
                            sx={{
                              color: series.color,
                              "&.Mui-checked": { color: series.color },
                              p: 0.5,
                            }}
                          />
                          <ListItemText
                            primary={label}
                            sx={{ "& .MuiListItemText-primary": { fontSize: "0.8rem" } }}
                          />
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )}

              {timeRangeOptions.length > 0 && (
                <FormControl size="small">
                  <InputLabel sx={{ fontSize: "0.72rem" }}>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    label="Time Range"
                    onChange={(e) => onTimeRangeChange(e.target.value)}
                    sx={{ minWidth: 110, fontSize: "0.72rem", "& .MuiSelect-select": { py: "4px" } }}
                  >
                    {timeRangeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value} sx={{ fontSize: "0.8rem" }}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {intervalOptionsMap[timeRange]?.length > 0 && (
                <FormControl size="small">
                  <InputLabel sx={{ fontSize: "0.72rem" }}>Interval</InputLabel>
                  <Select
                    value={interval}
                    label="Interval"
                    onChange={(e) => onIntervalChange(e.target.value)}
                    sx={{ minWidth: 80, fontSize: "0.72rem", "& .MuiSelect-select": { py: "4px" } }}
                  >
                    {intervalOptionsMap[timeRange]?.map((intervalOption) => (
                      <MenuItem key={intervalOption} value={intervalOption} sx={{ fontSize: "0.8rem" }}>
                        {intervalOption}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Stack>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Legend positioned above the chart */}
            <ChartDataProvider
              dataset={dataset || []}
              series={[...visibleLineSeries, ...visibleBarSeries]}
              xAxis={[
                {
                  dataKey: "time",
                  scaleType: "band",
                  label: timeRange?.endsWith("h") ? "Time" : "Date",
                  tickLabelMinGap: 20,
                  disableTicks: true,
                  valueFormatter: (value: string) => {
                    return parseChartTime(value, timeRange);
                  },
                },
              ]}
              yAxis={[
                {
                  id: "leftAxis",
                  label: leftAxisLabel,
                  min: 0,
                },
                {
                  id: "rightAxis",
                  label: rightAxisLabel,
                  position: "right",
                  min: 0,
                },
              ]}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  paddingBottom: height < 250 ? 0.5 : 1.5,
                  flexShrink: 0,
                  width: "100%",
                  "& .MuiChartsLegend-root": {
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    maxWidth: "100%",
                    gap: "4px",
                  },
                  "& .MuiChartsLegend-series": {
                    flexShrink: 0,
                  },
                }}
              >
                <ChartsLegend direction="horizontal" />
              </Box>

              <Box sx={{ flex: 1, position: "relative", minHeight: 0 }}>
                <ChartsSurface
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  <ChartsGrid horizontal />
                  <BarPlot />
                  <LinePlot />
                  <MarkPlot
                    slots={{
                      mark: ({ x, y, color, isHighlighted }) => (
                        <circle
                          cx={x}
                          cy={y}
                          r={5}
                          fill={isHighlighted ? color : "transparent"}
                        />
                      ),
                    }}
                    slotProps={{
                      mark: {
                        shape: "circle",
                        skipAnimation: false,
                      },
                    }}
                  />

                  <ChartsXAxis />
                  <ChartsYAxis axisId="leftAxis" />
                  <ChartsYAxis axisId="rightAxis" />
                  <ChartsTooltip />
                </ChartsSurface>
              </Box>
            </ChartDataProvider>
          </Box>
        </CardContent>
      </Card>
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(255,255,255,0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
          }}
        >
          <CircularProgress size={32} thickness={4} />
        </Box>
      )}
    </ToggleFullscreen>
  );
};

export default DynamicChart;
