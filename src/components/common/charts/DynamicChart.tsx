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
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [hiddenSeries, setHiddenSeries] = React.useState<Set<string>>(
    new Set()
  );
  const { lineSeries, barSeries, leftAxisLabel, rightAxisLabel } = chartConfig;

  const handleFullscreenChange = (fullscreenMode: boolean) => {
    setIsFullscreen(fullscreenMode);
  };

  const handleLegendClick = (
    _event: React.MouseEvent<HTMLButtonElement>,
    legendItem: any,
    _index: number
  ) => {
    const seriesKey = legendItem.id;
    if (seriesKey) {
      setHiddenSeries((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(seriesKey)) {
          newSet.delete(seriesKey);
        } else {
          newSet.add(seriesKey);
        }
        return newSet;
      });
    }
  };

  // Filter out hidden series
  const visibleLineSeries = lineSeries.filter(
    (series) => series.dataKey && !hiddenSeries.has(series.dataKey)
  );
  const visibleBarSeries = barSeries.filter(
    (series) => series.dataKey && !hiddenSeries.has(series.dataKey)
  );

  console.log("ttt : ", title , timeRange)

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
            sx={{ mb: 3 }}
            flexWrap="wrap"
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {title}
            </Typography>

            <Stack direction="row" spacing={3} alignItems="center">
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
                  alignItems: "center",
                  paddingBottom: 1,
                  flexShrink: 0,
                }}
              >
                <ChartsLegend
                  direction="horizontal"
                  onItemClick={handleLegendClick}
                />
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
