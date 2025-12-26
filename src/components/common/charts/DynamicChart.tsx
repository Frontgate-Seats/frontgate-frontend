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
  ChartContainer,
  ChartsGrid,
  ChartsTooltip,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  BarPlot,
  MarkPlot,
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
  height = 300,
  onFullscreenChange,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const { lineSeries, barSeries, leftAxisLabel, rightAxisLabel } = chartConfig;

  const handleFullscreenChange = (fullscreenMode: boolean) => {
    setIsFullscreen(fullscreenMode);
    onFullscreenChange?.(fullscreenMode);
  };

  // Adjust height based on fullscreen mode
  // In fullscreen, use viewport height minus space for controls and padding
  const chartHeight = isFullscreen ? Math.max(400, window.innerHeight * 0.7) : height;

  return (
    <ToggleFullscreen onFullscreenChange={handleFullscreenChange} >
      <Card variant="outlined">
        <CardContent sx={{ position: "relative" }}>
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
            </Stack>
          </Stack>

          <ChartContainer
            dataset={dataset || []}
            series={[...lineSeries, ...barSeries]}
            xAxis={[
              {
                dataKey: "time",
                scaleType: "band",
                label: timeRange === "1d" ? "Time" : "Date",
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
            height={chartHeight}
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
          </ChartContainer>

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
        </CardContent>
      </Card>
    </ToggleFullscreen>
  );
};

export default DynamicChart;
