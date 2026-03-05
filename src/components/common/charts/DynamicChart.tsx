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
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [hiddenSeries, setHiddenSeries] = React.useState<Set<string>>(
    new Set(),
  );
  const { lineSeries, barSeries, leftAxisLabel, rightAxisLabel } = chartConfig;

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

  console.log("ttt : ", title, timeRange);

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
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 3, gap: 2 }}
            flexWrap="wrap"
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              {customLogoComponent ? (
                customLogoComponent
              ) : logo ? (
                <Tooltip
                  title={
                    logo.includes("tj-logo")
                      ? "Ticket Jokey"
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
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {title}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              {/* Series Selector */}
              {allSeries.length > 0 && (
                <FormControl size="small">
                  <InputLabel>Series</InputLabel>
                  <Select
                    multiple
                    value={visibleSeriesIds}
                    onChange={handleSeriesToggle}
                    input={<OutlinedInput label="Series" />}
                    renderValue={(selected) => `${selected.length} selected`}
                    sx={{ minWidth: 140 }}
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
                              "&.Mui-checked": {
                                color: series.color,
                              },
                            }}
                          />
                          <ListItemText
                            primary={label}
                            sx={{
                              "& .MuiListItemText-primary": {
                                fontSize: "0.875rem",
                              },
                            }}
                          />
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )}

              {timeRangeOptions.length > 0 && (
                <FormControl size="small">
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    label="Time Range"
                    onChange={(e) => onTimeRangeChange(e.target.value)}
                    sx={{ minWidth: 150 }}
                  >
                    {timeRangeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {intervalOptionsMap[timeRange]?.length > 0 && (
                <FormControl size="small">
                  <InputLabel>Interval</InputLabel>
                  <Select
                    value={interval}
                    label="Interval"
                    onChange={(e) => onIntervalChange(e.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    {intervalOptionsMap[timeRange]?.map((intervalOption) => (
                      <MenuItem key={intervalOption} value={intervalOption}>
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
                  paddingBottom: 2,
                  flexShrink: 0,
                  width: "100%",
                  "& .MuiChartsLegend-root": {
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    maxWidth: "100%",
                    gap: "8px",
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
