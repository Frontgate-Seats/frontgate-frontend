import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Alert,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Box,
  CircularProgress,
} from "@mui/material";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { fetchTopEvents } from "../store/slices/charts.slice";
import moment from "moment";
import dayjs from "dayjs";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type {
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from "@mui/x-data-grid";
import { getListingsMeta } from "../store/slices/listingsMeta.slice";
import type { CustomGridColDef } from "../shared/types/mui.type";
import {
  BarPlot,
  ChartContainer,
  ChartsGrid,
  ChartsTooltip,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  MarkPlot,
  type BarSeriesType,
  type LineSeriesType,
} from "@mui/x-charts";

// ---------------------- Types ----------------------
type ListingMeta = Record<string, any> & {
  createdAt: string;
  ticketCount?: number;
  priceMin?: number;
  twoPlusPriceMin?: number;
  getInPriceMin?: number;
};

type TopEventRow = {
  eventId: string;
  name?: string;
  startValue?: number | null;
  endValue?: number | null;
  change?: number | null;
  percentChange?: number | null;
  // optional fields used when selecting the event
  utcDate?: string | null;
  venueDBId?: any;
  performerDBIds?: any[];
};

// ---------------------- Constants ----------------------
const CHART_TIME_RANGE_OPTIONS = [
  { value: "10m", label: "Last 10 Minutes" },
  { value: "20m", label: "Last 20 Minutes" },
  { value: "30m", label: "Last 30 Minutes" },
  { value: "1h", label: "Last 1 Hour" },
  { value: "6h", label: "Last 6 Hours" },
  { value: "12h", label: "Last 12 Hours" },
  { value: "1d", label: "Last 1 Day" },
  { value: "3d", label: "Last 3 Days" },
  { value: "7d", label: "Last 7 Days" },
  { value: "15d", label: "Last 15 Days" },
  { value: "1M", label: "Last 1 Month" },
];

const FIELD_OPTIONS = [
  { value: "allInPriceAverage", label: "All-In Price Average" },
  { value: "allInPriceMin", label: "All-In Price Min" },
  { value: "allInPriceMax", label: "All-In Price Max" },
  { value: "allInPriceMedian", label: "All-In Price Median" },
  { value: "priceAverage", label: "Price Average" },
  { value: "priceMin", label: "Price Min" },
  { value: "priceMax", label: "Price Max" },
  { value: "priceMedian", label: "Price Median" },
  { value: "getInPriceAverage", label: "Get-In Price Average" },
  { value: "getInPriceMin", label: "Get-In Price Min" },
  { value: "getInPriceMax", label: "Get-In Price Max" },
  { value: "getInPriceMedian", label: "Get-In Price Median" },
  { value: "twoPlusPriceAverage", label: "2+ Price Average" },
  { value: "twoPlusPriceMin", label: "2+ Price Min" },
  { value: "twoPlusPriceMax", label: "2+ Price Max" },
  { value: "twoPlusPriceMedian", label: "2+ Price Median" },
];

const TIME_RANGE_OPTIONS = [
  { value: "1d", label: "Last Day" },
  { value: "7d", label: "Last Week" },
  { value: "30d", label: "Last Month" },
  { value: "3m", label: "Last 3 Months" },
  { value: "6m", label: "Last 6 Months" },
  { value: "1y", label: "Last Year" },
];

const INTERVAL_OPTIONS_MAP: Record<string, string[]> = {
  "1d": ["10m", "30m", "1h", "3h", "6h"],
  "7d": ["3h", "6h", "12h", "1d", "3d"],
  "30d": ["12h", "1d", "3d", "7d", "15d"],
  "3m": ["3d", "7d", "30d"],
  "6m": ["7d", "30d", "90d"],
  "1y": ["30d", "90d", "180d"],
};

const defaultInterval = (range: string) => INTERVAL_OPTIONS_MAP[range][2];

const COLUMNS: CustomGridColDef[] = [
  { field: "eventId", headerName: "Event ID", flex: 1.2, minWidth: 150 },
  {
    field: "startValue",
    headerName: "Start Value",
    flex: 0.8,
    type: "number",
    min: 0,
    max: 10000,
  },
  {
    field: "endValue",
    headerName: "End Value",
    flex: 0.8,
    type: "number",
    min: 0,
    max: 10000,
  },
  {
    field: "change",
    headerName: "Change",
    flex: 0.8,
    type: "number",
    min: 0,
    max: 10000,
  },
  {
    field: "percentChange",
    headerName: "% Change",
    flex: 0.8,
    type: "number",
    min: 0,
    max: 10000,
    valueFormatter: (v) => (v != null ? `${Number(v).toFixed(2)}%` : "-"),
    cellClassName: (params) =>
      params.value > 0
        ? "text-green-600 font-medium"
        : params.value < 0
        ? "text-red-600 font-medium"
        : "",
  },
];

// ---------------------- Utilities ----------------------
const parseIntervalMs = (interval: string) => {
  if (interval.endsWith("d")) return parseInt(interval) * 24 * 60 * 60 * 1000;
  if (interval.endsWith("h")) return parseInt(interval) * 60 * 60 * 1000;
  if (interval.endsWith("m")) return parseInt(interval) * 60 * 1000;
  return 0;
};

const computeFromISO = (range: string) => {
  let fromDate = moment.utc();

  if (range.endsWith("m"))
    fromDate = fromDate.subtract(parseInt(range), "minutes");
  else if (range.endsWith("h"))
    fromDate = fromDate.subtract(parseInt(range), "hours");
  else if (range.endsWith("d"))
    fromDate = fromDate.subtract(parseInt(range), "days");
  else if (range.endsWith("M"))
    fromDate = fromDate.subtract(parseInt(range), "months");

  return fromDate.toISOString();
};

// compute bucketed dataset given listings and timeframe
const buildBucketedDataset = (
  listings: ListingMeta[],
  timeRange: string,
  interval: string
) => {
  if (!listings || listings.length === 0) return [] as any[];

  const now = moment.utc();
  const fromDate = now.clone();

  switch (timeRange) {
    case "1d":
      fromDate.subtract(1, "day");
      break;
    case "7d":
      fromDate.subtract(7, "days");
      break;
    case "30d":
      fromDate.subtract(30, "days");
      break;
    case "3m":
      fromDate.subtract(3, "months");
      break;
    case "6m":
      fromDate.subtract(6, "months");
      break;
    case "1y":
      fromDate.subtract(1, "year");
      break;
  }

  const rangeStart = fromDate.valueOf();
  const rangeEnd = now.valueOf();
  const intervalMs = parseIntervalMs(interval);

  // sort ascending
  const sorted = [...listings].sort(
    (a, b) =>
      moment.utc(a.createdAt).valueOf() - moment.utc(b.createdAt).valueOf()
  );

  // last known before rangeStart
  let lastBefore: ListingMeta | null = null;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const t = moment.utc(sorted[i].createdAt).valueOf();
    if (t < rangeStart) {
      lastBefore = sorted[i];
      break;
    }
  }

  const inRange = sorted.filter((i) => {
    const t = moment.utc(i.createdAt).valueOf();
    return t >= rangeStart && t <= rangeEnd;
  });

  const grouped: Record<number, ListingMeta[]> = {};
  inRange.forEach((item) => {
    const t = moment.utc(item.createdAt).valueOf();
    const bucket = Math.floor(t / intervalMs) * intervalMs;
    if (!grouped[bucket]) grouped[bucket] = [];
    grouped[bucket].push(item);
  });

  const result: any[] = [];

  let lastValue = lastBefore
    ? {
        tickets: lastBefore.ticketCount ?? 0,
        priceMin: lastBefore.priceMin ?? 0,
        twoPlusPriceMin: lastBefore.twoPlusPriceMin ?? 0,
        getInPriceMin: lastBefore.getInPriceMin ?? 0,
      }
    : { tickets: 0, priceMin: 0, twoPlusPriceMin: 0, getInPriceMin: 0 };

  const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
  const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

  for (let t = startBucket; t <= endBucket; t += intervalMs) {
    const arr = grouped[t] || [];
    if (arr.length === 0) {
      result.push({
        ...lastValue,
        time: moment.utc(t).local().format("MM/DD/YYYY hh:mm A"),
        bucketStartUTC: moment.utc(t).toISOString(),
      });
    } else {
      const avg = (field: string) =>
        arr.reduce((s, i) => s + (i[field] ?? 0), 0) / arr.length;
      lastValue = {
        tickets: Math.round(avg("ticketCount")),
        priceMin: +avg("priceMin").toFixed(2),
        twoPlusPriceMin: +avg("twoPlusPriceMin").toFixed(2),
        getInPriceMin: +avg("getInPriceMin").toFixed(2),
      };

      result.push({
        ...lastValue,
        time: moment.utc(t).local().format("MM/DD/YYYY hh:mm A"),
        bucketStartUTC: moment.utc(t).toISOString(),
      });
    }
  }

  return result;
};

// ---------------------- Component ----------------------
const ChartsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // charts slice
  const {
    data: chartRows,
    loading: chartLoading,
    error: chartError,
  } = useSelector((s: RootState) => s.charts);

  // listings meta slice
  const {
    rows: { data: listingsMeta },
    loading: listingsMetaLoading,
  } = useSelector((state: RootState) => state.listingsMeta);

  // local UI state
  const [chartTimeRange, setChartTimeRange] = useState<string>("20m");
  const [chartField, setChartField] = useState<string>("getInPriceMin");
  const [chartFrom, setChartFrom] = useState<string>(computeFromISO("20m"));

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  const [selectedEvent, setSelectedEvent] = useState<TopEventRow | null>(null);
  const [timeRange, setTimeRange] = useState<string>("1d");
  const [interval, setInterval] = useState<string>(defaultInterval("1d"));

  // ------------- Effects: compute from & fetch charts -------------
  useEffect(() => {
    setChartFrom(computeFromISO(chartTimeRange));
  }, [chartTimeRange]);

  useEffect(() => {
    if (!chartFrom || !chartField) return;
    dispatch(fetchTopEvents({ from: chartFrom, field: chartField }));
  }, [chartFrom, chartField, dispatch]);

  // fetch listings meta for selected event
  useEffect(() => {
    if (!selectedEvent) return;

    const filters = {
      items: [
        { field: "eventId", operator: "equals", value: selectedEvent.eventId },
      ],
    };
    dispatch(getListingsMeta({ filters, page: -1, pageSize: -1 }));
  }, [selectedEvent, dispatch]);

  // ------------- Derived data: filtering, sorting, pagination -------------
  const filteredRows = useMemo(() => {
    if (!filterModel.items.length) return chartRows;

    return chartRows.filter((row) =>
      filterModel.items.every(({ field, operator, value }) => {
        if (value == null || value === "") return true;
        const col = COLUMNS.find((c) => c.field === field);
        const type = col?.type ?? "string";
        const fieldValue = row[field];

        switch (type) {
          case "number": {
            const fv = Number(fieldValue);
            const val = Number(value);
            if (isNaN(fv) || isNaN(val)) return false;
            if (operator === ">=") return fv >= val;
            if (operator === "<=") return fv <= val;
            if (operator === "equals") return fv === val;
            return true;
          }
          case "date":
          case "dateTime": {
            const fv = dayjs(fieldValue);
            const val = dayjs(value);
            if (!fv.isValid() || !val.isValid()) return false;
            if (operator === "onOrAfter")
              return fv.isSame(val, "day") || fv.isAfter(val, "day");
            if (operator === "onOrBefore")
              return fv.isSame(val, "day") || fv.isBefore(val, "day");
            return true;
          }
          case "singleSelect":
            return String(fieldValue ?? "") === String(value);
          default:
            if (operator === "contains")
              return String(fieldValue ?? "")
                .toLowerCase()
                .includes(String(value).toLowerCase());
            if (operator === "equals")
              return (
                String(fieldValue ?? "").toLowerCase() ===
                String(value).toLowerCase()
              );
            return true;
        }
      })
    );
  }, [filterModel, chartRows]);

  const sortedRows = useMemo(() => {
    if (!sortModel.length) return filteredRows;
    const { field, sort } = sortModel[0];
    return [...filteredRows].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (aValue < bValue) return sort === "asc" ? -1 : 1;
      if (aValue > bValue) return sort === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortModel]);

  const paginatedRows = useMemo(() => {
    const { page, pageSize } = paginationModel;
    return sortedRows.slice(page * pageSize, page * pageSize + pageSize);
  }, [sortedRows, paginationModel]);

  // ------------- Dataset for charts -------------
  const dataset = useMemo(
    () => buildBucketedDataset(listingsMeta ?? [], timeRange, interval),
    [listingsMeta, timeRange, interval]
  );

  // ------------- Series definitions -------------
  const lineSeries: LineSeriesType[] = useMemo(
    () => [
      {
        type: "line",
        label: "Min Price",
        dataKey: "priceMin",
        color: "#1976d2",
        yAxisId: "leftAxis",
        valueFormatter: (v) => (v != null ? `$${v}` : "-"),
      },
      {
        type: "line",
        label: "Min Price 2+",
        dataKey: "twoPlusPriceMin",
        color: "#ff7043",
        yAxisId: "leftAxis",
        valueFormatter: (v) => (v != null ? `$${v}` : "-"),
      },
      {
        type: "line",
        label: "GetIn Price Min 2+",
        dataKey: "getInPriceMin",
        color: "#26a69a",
        yAxisId: "leftAxis",
        valueFormatter: (v) => (v != null ? `$${v}` : "-"),
      },
    ],
    []
  );

  const barSeries: BarSeriesType[] = useMemo(
    () => [
      {
        type: "bar",
        label: "Tickets",
        dataKey: "tickets",
        color: "rgba(144,164,174,0.45)",
        yAxisId: "rightAxis",
        valueFormatter: (v) => (v != null ? `${v}` : "-"),
      },
    ],
    []
  );

  // ------------- Handlers -------------
  const handleRefresh = useCallback(
    () => setChartFrom(computeFromISO(chartTimeRange)),
    [chartTimeRange]
  );

  const handleRowClick = useCallback(
    (row: any) => {
      if (row.eventId === selectedEvent?.eventId) return;
      setSelectedEvent(row);
    },
    [selectedEvent]
  );

  // ------------- Render -------------
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Grid container spacing={3}>
        {selectedEvent && (
          <>
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {selectedEvent?.name}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Date & Time (UTC)
                      </Typography>
                      <Typography variant="body1">
                        {selectedEvent?.utcDate
                          ? moment(selectedEvent.utcDate).format(
                              "MM/DD/YYYY hh:mm A"
                            )
                          : ""}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Venue
                      </Typography>
                      <Typography variant="body1">
                        {selectedEvent?.venueDBId
                          ? `${selectedEvent.venueDBId?.city}, ${selectedEvent.venueDBId?.stateCode} (${selectedEvent.venueDBId.countryCode})`
                          : "-"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Performer
                      </Typography>
                      <Typography variant="body1">
                        {selectedEvent?.performerDBIds?.length
                          ? selectedEvent.performerDBIds
                              .map((p: any) => p?.name)
                              .filter(Boolean)
                              .join(", ")
                          : "-"}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent sx={{ position: "relative" }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 3 }}
                    flexWrap="wrap"
                  >
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Trends
                    </Typography>

                    <Stack direction="row" spacing={3} alignItems="center">
                      <FormControl size="small">
                        <InputLabel>Time Range</InputLabel>
                        <Select
                          value={timeRange}
                          label="Time Range"
                          onChange={(e) => setTimeRange(e.target.value)}
                          sx={{ minWidth: 150 }}
                        >
                          {TIME_RANGE_OPTIONS.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                              {o.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small">
                        <InputLabel>Interval</InputLabel>
                        <Select
                          value={interval}
                          label="Interval"
                          onChange={(e) => setInterval(e.target.value)}
                          sx={{ minWidth: 120 }}
                        >
                          {INTERVAL_OPTIONS_MAP[timeRange].map((i) => (
                            <MenuItem key={i} value={i}>
                              {i}
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
                        label: "Date & Time",
                        tickLabelMinGap: 20,
                        disableTicks: true,
                      },
                    ]}
                    yAxis={[
                      { id: "leftAxis", label: "Price ($)", min: 0 },
                      {
                        id: "rightAxis",
                        label: "Tickets Qty",
                        position: "right",
                        min: 0,
                      },
                    ]}
                    height={300}
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
                        mark: { shape: "circle", skipAnimation: false },
                      }}
                    />

                    <ChartsXAxis />
                    <ChartsYAxis axisId="leftAxis" />
                    <ChartsYAxis axisId="rightAxis" />
                    <ChartsTooltip />
                  </ChartContainer>

                  {listingsMetaLoading && (
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
                      <CircularProgress
                        size={32}
                        thickness={4}
                        sx={{ color: "primary.main" }}
                      />
                    </Box>
                  )}

                  {dataset.length === 0 && (
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      align="center"
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      No data available
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Controls: Chart Time Range, Field, Refresh */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={chartTimeRange}
              label="Time Range"
              onChange={(e) => setChartTimeRange(e.target.value)}
            >
              {CHART_TIME_RANGE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Field</InputLabel>
            <Select
              value={chartField}
              label="Field"
              onChange={(e) => setChartField(e.target.value)}
            >
              {FIELD_OPTIONS.map((f) => (
                <MenuItem key={f.value} value={f.value}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid
          size={{ xs: 12, sm: 4, md: 2 }}
          display="flex"
          alignItems="center"
        >
          <Button
            fullWidth
            variant="contained"
            sx={{ height: 40 }}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Grid>

        <Grid size={{ xs: 12 }}>
          {chartError ? (
            <Alert severity="error">{chartError}</Alert>
          ) : (
            <CustomDataGrid
              title="Top Events"
              rows={paginatedRows}
              rowCount={chartRows.length}
              isLoading={chartLoading}
              error={chartError as any}
              columns={COLUMNS}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              sortingModel={sortModel}
              setSortingModel={setSortModel}
              filterModel={filterModel}
              setFilterModel={setFilterModel}
              onRefresh={handleRefresh}
              onRowClick={(value) => handleRowClick(value.row)}
            />
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ChartsPage;
