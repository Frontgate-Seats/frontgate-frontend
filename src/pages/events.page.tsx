// Full updated file with two separate charts
// (Chart 1 = Price Trends, Chart 2 = Trends)
// React + MUI + MUI X Charts

import * as React from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Alert,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
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
  type BarSeriesType,
  type LineSeriesType,
} from "@mui/x-charts";
import { BarChart } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type {
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from "@mui/x-data-grid";
import moment from "moment";

import type { RootState } from "../store";
import { getEvents } from "../store/slices/events.slice";
import { getListingsMeta } from "../store/slices/listingsMeta.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { getSalesMeta } from "../store/slices/salesMeta.slice";

export default function EventsPage() {
  const dispatch = useAppDispatch();
  const chartRef = React.useRef<HTMLDivElement>(null);

  // ------------------------
  // Time Range
  // ------------------------
  const timeRangeOptions = [
    { value: "1d", label: "Last Day" },
    { value: "7d", label: "Last Week" },
    { value: "30d", label: "Last Month" },
    { value: "3m", label: "Last 3 Months" },
    { value: "6m", label: "Last 6 Months" },
    { value: "1y", label: "Last Year" },
  ];

  const intervalOptionsMap: Record<string, string[]> = {
    "1d": ["1h", "3h", "6h"],
    "7d": ["3h", "6h", "12h", "1d", "3d"],
    "30d": ["12h", "1d", "3d", "7d", "15d"],
    "3m": ["3d", "7d", "30d"],
    "6m": ["7d", "30d", "90d"],
    "1y": ["30d", "90d", "180d"],
  };

  const defaultInterval = (range: string) => intervalOptionsMap[range][0];

  // ------------------------
  // Redux Data
  // ------------------------
  const {
    rows: { data: events, total },
    loading: eventsLoading,
    error: eventsError,
  } = useSelector((state: RootState) => state.events);

  const {
    rows: { data: listingsMeta },
    loading: listingsMetaLoading,
  } = useSelector((state: RootState) => state.listingsMeta);

  const {
    rows: { data: salesMeta },
    loading: salesMetaLoading,
  } = useSelector((state: RootState) => state.salesMeta);

  // ------------------------
  // Grid State
  // ------------------------
  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: "localDate", sort: "asc" },
  ]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [
      { field: "category", operator: "is", value: "Sports" },
      {
        field: "localDate",
        operator: "onOrAfter",
        value: dayjs().toISOString(),
      },
      {
        field: "localDate",
        operator: "onOrBefore",
        value: dayjs().add(6, "months").toISOString(),
      },
    ],
  });

  // ------------------------
  // Selected + Chart State
  // ------------------------
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);
  const [timeRangeGraphOne, setTimeRangeGraphOne] = React.useState("1d");
  const [intervalGraphOne, setIntervalGraphOne] = React.useState("1h");

  const [timeRangeGraphTwo, setTimeRangeGraphTwo] = React.useState("7d");
  const [intervalGraphTwo, setIntervalGraphTwo] = React.useState("1d");

  const [timeRangeGraphThree, setTimeRangeGraphThree] = React.useState("1d");
  const [intervalGraphThree, setIntervalGraphThree] = React.useState("1h");

  const [timeRangeGraphFour, setTimeRangeGraphFour] = React.useState("7d");
  const [intervalGraphFour, setIntervalGraphFour] = React.useState("1d");

  React.useEffect(() => {
    setIntervalGraphOne(defaultInterval(timeRangeGraphOne));
  }, [timeRangeGraphOne]);

  React.useEffect(() => {
    setIntervalGraphTwo(defaultInterval(timeRangeGraphTwo));
  }, [timeRangeGraphTwo]);

  React.useEffect(() => {
    setIntervalGraphThree(defaultInterval(timeRangeGraphThree));
  }, [timeRangeGraphThree]);

  React.useEffect(() => {
    setIntervalGraphFour(defaultInterval(timeRangeGraphFour));
  }, [timeRangeGraphFour]);

  // ------------------------
  // Fetch events
  // ------------------------
  React.useEffect(() => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      })
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handleRefresh = React.useCallback(() => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      })
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handleRowClick = (row: any) => {
    if (row.eventId === selectedEvent?.eventId) return;
    setSelectedEvent(row);

    // Smooth scroll to top using ref
    setTimeout(() => {
      chartRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
  };

  // ------------------------
  // Fetch listingsMeta for selected event
  // ------------------------
  React.useEffect(() => {
    if (!selectedEvent) return;

    const listingsMetaFilters = {
      items: [
        { field: "eventId", operator: "equals", value: selectedEvent.eventId },
      ],
    };

    // Find seatgeek match for sales data
    const seatgeekMatch = selectedEvent.matches?.find((m: any) => m.providerName === "seatgeek");
    
    const salesMetaFilters = {
      items: [
        { field: "eventId", operator: "equals", value: seatgeekMatch?.eventId},
      ],
    };

    // ✅ Call immediately once
    dispatch(
      getListingsMeta({ filters: listingsMetaFilters, page: -1, pageSize: -1 })
    );
    dispatch(
      getSalesMeta({ filters: salesMetaFilters, page: -1, pageSize: -1 })
    );

    // ✅ Then call every 10 minutes
    const intervalId = setInterval(() => {
      dispatch(
        getListingsMeta({
          filters: listingsMetaFilters,
          page: -1,
          pageSize: -1,
        })
      );
      dispatch(
        getSalesMeta({ filters: salesMetaFilters, page: -1, pageSize: -1 })
      );
    }, 600000); // 600000 ms = 10 minutes

    // ✅ Cleanup on unmount or change in selectedEvent
    return () => clearInterval(intervalId);
  }, [selectedEvent, dispatch]);

  // ------------------------
  // Dataset Builder for Listings Meta (Reusable)
  // ------------------------
  const buildListingsDataset = (lm: any[], timeRange: string, interval: string) => {
    if (!lm || lm.length === 0) return [];

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

    const intervalMs = interval.endsWith("d")
      ? parseInt(interval) * 24 * 60 * 60 * 1000
      : interval.endsWith("h")
      ? parseInt(interval) * 60 * 60 * 1000
      : parseInt(interval) * 60 * 1000;

    const sorted = [...lm].sort(
      (a, b) =>
        moment.utc(a.createdAt).valueOf() - moment.utc(b.createdAt).valueOf()
    );

    let lastBefore = null;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const t = moment.utc(sorted[i].createdAt).valueOf();
      if (t < rangeStart) {
        lastBefore = sorted[i];
        break;
      }
    }

    const rangeData = sorted.filter((item) => {
      const t = moment.utc(item.createdAt).valueOf();
      return t >= rangeStart && t <= rangeEnd;
    });

    const grouped: Record<number, any[]> = {};
    rangeData.forEach((item) => {
      const time = moment.utc(item.createdAt).valueOf();
      const bucket = Math.floor(time / intervalMs) * intervalMs;
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
        const avg = (f: string) =>
          arr.reduce((s, i) => s + (i[f] ?? 0), 0) / arr.length;

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

  // ------------------------
  // Dataset Builder for Sales Meta (Reusable)
  // ------------------------
    const buildSalesDataset = (sm: any[], timeRange: string, interval: string) => {
    if (!sm || sm.length === 0) return [];

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

    const intervalMs = interval.endsWith("d")
      ? parseInt(interval) * 24 * 60 * 60 * 1000
      : interval.endsWith("h")
      ? parseInt(interval) * 60 * 60 * 1000
      : parseInt(interval) * 60 * 1000;

    const sorted = [...sm].sort(
      (a, b) =>
        moment.utc(a.createdAt).valueOf() - moment.utc(b.createdAt).valueOf()
    );

    const rangeData = sorted.filter((item) => {
      const t = moment.utc(item.createdAt).valueOf();
      return t >= rangeStart && t <= rangeEnd;
    });

    const grouped: Record<number, any[]> = {};
    rangeData.forEach((item) => {
      const time = moment.utc(item.createdAt).valueOf();
      const bucket = Math.floor(time / intervalMs) * intervalMs;
      if (!grouped[bucket]) grouped[bucket] = [];
      grouped[bucket].push(item);
    });

    const result: any[] = [];
    const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
    const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const arr = grouped[t] || [];

      if (arr.length === 0) {
        // Use 0 values for time slots without data
        result.push({
          totalSales: 0,
          totalUnits: 0,
          totalSalesPrice: 0,
          minPrice: 0,
          maxPrice: 0,
          averagePrice: 0,
          medianPrice: 0,
          time: moment.utc(t).local().format("MM/DD/YYYY hh:mm A"),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      } else {
        const avg = (f: string) =>
          arr.reduce((s, i) => s + (i[f] ?? 0), 0) / arr.length;

        result.push({
          totalSales: Math.round(avg("totalSales")),
          totalUnits: Math.round(avg("totalUnits")),
          totalSalesPrice: +avg("totalSalesPrice").toFixed(2),
          minPrice: +avg("minPrice").toFixed(2),
          maxPrice: +avg("maxPrice").toFixed(2),
          averagePrice: +avg("averagePrice").toFixed(2),
          medianPrice: +avg("medianPrice").toFixed(2),
          time: moment.utc(t).local().format("MM/DD/YYYY hh:mm A"),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      }
    }

    return result;
  };

  // Datasets for Listings Meta (Graphs 1 & 2)
  const datasetOne = React.useMemo(
    () => buildListingsDataset(listingsMeta || [], timeRangeGraphOne, intervalGraphOne),
    [listingsMeta, timeRangeGraphOne, intervalGraphOne]
  );

  const datasetTwo = React.useMemo(
    () => buildListingsDataset(listingsMeta || [], timeRangeGraphTwo, intervalGraphTwo),
    [listingsMeta, timeRangeGraphTwo, intervalGraphTwo]
  );

  // Datasets for Sales Meta (Graphs 3 & 4)
  const datasetThree = React.useMemo(
    () => buildSalesDataset(salesMeta || [], timeRangeGraphThree, intervalGraphThree),
    [salesMeta, timeRangeGraphThree, intervalGraphThree]
  );

  const datasetFour = React.useMemo(
    () => buildSalesDataset(salesMeta || [], timeRangeGraphFour, intervalGraphFour),
    [salesMeta, timeRangeGraphFour, intervalGraphFour]
  );

  // ------------------------
  // Charts Config - Listings Meta (Graphs 1 & 2)
  // ------------------------
  const listingsLineSeries: LineSeriesType[] = [
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
  ];

  const listingsBarSeries: BarSeriesType[] = [
    {
      type: "bar",
      label: "Tickets",
      dataKey: "tickets",
      color: "rgba(144,164,174,0.45)",
      yAxisId: "rightAxis",
    },
  ];

  // ------------------------
  // Charts Config - Sales Meta (Graphs 3 & 4)
  // ------------------------
  const salesLineSeries: LineSeriesType[] = [
    {
      type: "line",
      label: "Min Price",
      dataKey: "minPrice",
      color: "#1976d2",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
    },
    {
      type: "line",
      label: "Average Price",
      dataKey: "averagePrice",
      color: "#ff7043",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
    },
    {
      type: "line",
      label: "Median Price",
      dataKey: "medianPrice",
      color: "#26a69a",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
    },
    {
      type: "line",
      label: "Max Price",
      dataKey: "maxPrice",
      color: "#9c27b0",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
    },
  ];

  const salesBarSeries: BarSeriesType[] = [
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
  ];

  const columns: CustomGridColDef[] = [
    {
      field: "view",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Tooltip title="View listings Meta Data">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(params.row);
            }}
            color="primary"
            size="small"
          >
            <BarChart />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "eventId",
      headerName: "Event ID",
      flex: 0.7,
      minWidth: 110,
      type: "number",
      headerAlign: "left",
      align: "left",
      renderCell: (params) => (
        <Link
          href={`https://www.vividseats.com/curling-canada-tickets-scotiabank-centre-11-25-2025--sports-other-sports/production/${params.value}`}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="primary"
          sx={{ fontWeight: 500 }}
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: "name",
      headerName: "Event Name",
      flex: 2,
      minWidth: 200,
      type: "string",
    },
    {
      field: "localDate",
      headerName: "Date & Time",
      type: "dateTime",
      flex: 1.2,
      minWidth: 170,
      valueFormatter: (value) =>
        value ? moment.parseZone(value).format("MM/DD/YYYY hh:mm A") : "-",
      renderEditCell: (params) => (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            value={params.value ? dayjs(params.value) : dayjs()}
            onChange={(value) =>
              params.api.setEditCellValue({
                id: params.id,
                field: params.field,
                value: value,
              })
            }
            minDateTime={dayjs()} // prevent past selection
          />
        </LocalizationProvider>
      ),
    },
    {
      field: "venueDBId",
      headerName: "Venue",
      flex: 1.5,
      minWidth: 200,
      valueGetter: (value: any) =>
        value
          ? `${value.city}, ${value.stateCode} (${value.countryCode})`
          : "-",
      filterable: false,
      sortable: false,
    },
    {
      field: "category",
      headerName: "Category",
      flex: 0.7,
      minWidth: 100,
      type: "singleSelect",
      valueOptions: ["Sports", "Concerts"],
    },
    {
      field: "ticketCount",
      headerName: "Tickets",
      flex: 0.7,
      minWidth: 90,
      type: "number",
      min: 0,
      max: 20000,
    },
    {
      field: "listingCount",
      headerName: "Listings",
      flex: 0.7,
      minWidth: 90,
      type: "number",
      min: 0,
      max: 20000,
    },
    {
      field: "getInPriceMedian",
      headerName: "Median Price",
      flex: 0.8,
      minWidth: 110,
      type: "number",
      min: 0,
      max: 20000,
      valueFormatter: (value) => (value >= 0 ? `$${value}` : "-"),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      headerAlign: "center",
      align: "center",
      flex: 1,
      minWidth: 150,
      getActions: (params) => [
        <Button
          key="listings"
          onClick={() =>
            window.open(`/listings/${params.row.eventId}`, "_blank")
          }
          variant="contained"
          size="small"
          sx={{ borderRadius: 2 }}
        >
          View Listings
        </Button>,
      ],
    },
  ];

  // ------------------------
  // Render
  // ------------------------
  return (
    <Stack
      padding={3}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Grid container spacing={3}>
        {selectedEvent && (
          <>
            {/* EVENT DETAILS */}
            <Grid size={{ xs: 12 }} ref={chartRef}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {selectedEvent?.name}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Date & Time
                      </Typography>
                      <Typography variant="body1">
                        {selectedEvent?.localDate
                          ? moment
                              .parseZone(selectedEvent.localDate)
                              .format("MM/DD/YYYY hh:mm A")
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

            {/* GRAPH 1 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent sx={{ position: "relative" }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 3 }}
                    flexWrap="wrap"
                  >
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Listings Meta - Graph 1
                    </Typography>

                    <Stack direction="row" spacing={3} alignItems="center">
                      <FormControl size="small">
                        <InputLabel>Time Range</InputLabel>
                        <Select
                          value={timeRangeGraphOne}
                          label="Time Range"
                          onChange={(e) => setTimeRangeGraphOne(e.target.value)}
                          sx={{ minWidth: 150 }}
                        >
                          {timeRangeOptions.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                              {o.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small">
                        <InputLabel>Interval</InputLabel>
                        <Select
                          value={intervalGraphOne}
                          label="Interval"
                          onChange={(e) => setIntervalGraphOne(e.target.value)}
                          sx={{ minWidth: 120 }}
                        >
                          {intervalOptionsMap[timeRangeGraphOne].map((i) => (
                            <MenuItem key={i} value={i}>
                              {i}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </Stack>

                  <ChartContainer
                    dataset={datasetOne || []}
                    series={[...listingsLineSeries, ...listingsBarSeries]}
                    xAxis={[
                      {
                        dataKey: "time",
                        scaleType: "band",
                        label: timeRangeGraphOne === "1d" ? "Time" : "Date",
                        tickLabelMinGap: 20,
                        disableTicks: true,
                        valueFormatter: (value: string) => {
                          const parsed = moment(value, "MM/DD/YYYY hh:mm A");
                          if (!parsed.isValid()) return value;
                          // For same day (1d): show time in 12-hour format with AM/PM
                          if (timeRangeGraphOne === "1d") {
                            return parsed.format("hh:mm A");
                          }
                          // For more than one day: show day and month
                          else {
                            return parsed.format("MM/DD");
                          }
                        },
                      },
                    ]}
                    yAxis={[
                      {
                        id: "leftAxis",
                        label: "Price ($)",
                        min: 0,
                      },
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
                      <CircularProgress size={32} thickness={4} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* GRAPH 2 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent sx={{ position: "relative" }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 3 }}
                    flexWrap="wrap"
                  >
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Listings Meta - Graph 2
                    </Typography>

                    <Stack direction="row" spacing={3} alignItems="center">
                      <FormControl size="small">
                        <InputLabel>Time Range</InputLabel>
                        <Select
                          value={timeRangeGraphTwo}
                          label="Time Range"
                          onChange={(e) => setTimeRangeGraphTwo(e.target.value)}
                          sx={{ minWidth: 150 }}
                        >
                          {timeRangeOptions.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                              {o.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small">
                        <InputLabel>Interval</InputLabel>
                        <Select
                          value={intervalGraphTwo}
                          label="Interval"
                          onChange={(e) => setIntervalGraphTwo(e.target.value)}
                          sx={{ minWidth: 120 }}
                        >
                          {intervalOptionsMap[timeRangeGraphTwo].map((i) => (
                            <MenuItem key={i} value={i}>
                              {i}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </Stack>

                  <ChartContainer
                    dataset={datasetTwo || []}
                    series={[...listingsLineSeries, ...listingsBarSeries]}
                    xAxis={[
                      {
                        dataKey: "time",
                        scaleType: "band",
                        label: timeRangeGraphTwo === "1d" ? "Time" : "Date",
                        tickLabelMinGap: 20,
                        disableTicks: true,
                        valueFormatter: (value: string) => {
                          const parsed = moment(value, "MM/DD/YYYY hh:mm A");
                          if (!parsed.isValid()) return value;
                          // For same day (1d): show time in 12-hour format with AM/PM
                          if (timeRangeGraphTwo === "1d") {
                            return parsed.format("hh:mm A");
                          }
                          // For more than one day: show day and month
                          else {
                            return parsed.format("MM/DD");
                          }
                        },
                      },
                    ]}
                    yAxis={[
                      {
                        id: "leftAxis",
                        label: "Price ($)",
                        min: 0,
                      },
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
                      <CircularProgress size={32} thickness={4} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* GRAPH 3 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent sx={{ position: "relative" }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 3 }}
                    flexWrap="wrap"
                  >
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Sales Meta - Graph 3
                    </Typography>

                    <Stack direction="row" spacing={3} alignItems="center">
                      <FormControl size="small">
                        <InputLabel>Time Range</InputLabel>
                        <Select
                          value={timeRangeGraphThree}
                          label="Time Range"
                          onChange={(e) =>
                            setTimeRangeGraphThree(e.target.value)
                          }
                          sx={{ minWidth: 150 }}
                        >
                          {timeRangeOptions.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                              {o.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small">
                        <InputLabel>Interval</InputLabel>
                        <Select
                          value={intervalGraphThree}
                          label="Interval"
                          onChange={(e) =>
                            setIntervalGraphThree(e.target.value)
                          }
                          sx={{ minWidth: 120 }}
                        >
                          {intervalOptionsMap[timeRangeGraphThree].map((i) => (
                            <MenuItem key={i} value={i}>
                              {i}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </Stack>

                  <ChartContainer
                    dataset={datasetThree || []}
                    series={[...salesLineSeries, ...salesBarSeries]}
                    xAxis={[
                      {
                        dataKey: "time",
                        scaleType: "band",
                        label: timeRangeGraphThree === "1d" ? "Time" : "Date",
                        tickLabelMinGap: 20,
                        disableTicks: true,
                        valueFormatter: (value: string) => {
                          const parsed = moment(value, "MM/DD/YYYY hh:mm A");
                          if (!parsed.isValid()) return value;
                          // For same day (1d): show time in 12-hour format with AM/PM
                          if (timeRangeGraphThree === "1d") {
                            return parsed.format("hh:mm A");
                          }
                          // For more than one day: show day and month
                          else {
                            return parsed.format("MM/DD");
                          }
                        },
                      },
                    ]}
                    yAxis={[
                      {
                        id: "leftAxis",
                        label: "Price ($)",
                        min: 0,
                      },
                      {
                        id: "rightAxis",
                        label: "Sales Count",
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

                  {salesMetaLoading && (
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
            </Grid>

            {/* GRAPH 4 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent sx={{ position: "relative" }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 3 }}
                    flexWrap="wrap"
                  >
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Sales Meta - Graph 4
                    </Typography>

                    <Stack direction="row" spacing={3} alignItems="center">
                      <FormControl size="small">
                        <InputLabel>Time Range</InputLabel>
                        <Select
                          value={timeRangeGraphFour}
                          label="Time Range"
                          onChange={(e) =>
                            setTimeRangeGraphFour(e.target.value)
                          }
                          sx={{ minWidth: 150 }}
                        >
                          {timeRangeOptions.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                              {o.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small">
                        <InputLabel>Interval</InputLabel>
                        <Select
                          value={intervalGraphFour}
                          label="Interval"
                          onChange={(e) => setIntervalGraphFour(e.target.value)}
                          sx={{ minWidth: 120 }}
                        >
                          {intervalOptionsMap[timeRangeGraphFour].map((i) => (
                            <MenuItem key={i} value={i}>
                              {i}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </Stack>

                  <ChartContainer
                    dataset={datasetFour || []}
                    series={[...salesLineSeries, ...salesBarSeries]}
                    xAxis={[
                      {
                        dataKey: "time",
                        scaleType: "band",
                        label: timeRangeGraphFour === "1d" ? "Time" : "Date",
                        tickLabelMinGap: 20,
                        disableTicks: true,
                        valueFormatter: (value: string) => {
                          const parsed = moment(value, "MM/DD/YYYY hh:mm A");
                          if (!parsed.isValid()) return value;
                          // For same day (1d): show time in 12-hour format with AM/PM
                          if (timeRangeGraphFour === "1d") {
                            return parsed.format("hh:mm A");
                          }
                          // For more than one day: show day and month
                          else {
                            return parsed.format("MM/DD");
                          }
                        },
                      },
                    ]}
                    yAxis={[
                      {
                        id: "leftAxis",
                        label: "Price ($)",
                        min: 0,
                      },
                      {
                        id: "rightAxis",
                        label: "Sales Count",
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

                  {salesMetaLoading && (
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
            </Grid>
          </>
        )}

        {/* EVENT GRID */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {eventsError ? (
            <Alert severity="error">{eventsError}</Alert>
          ) : (
            <CustomDataGrid
              title="Events"
              rows={events}
              rowCount={total}
              columns={columns}
              isLoading={eventsLoading}
              error={eventsError as any}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              sortingModel={sortModel}
              setSortingModel={setSortModel}
              filterModel={filterModel}
              setFilterModel={setFilterModel}
              onRefresh={handleRefresh}
            />
          )}
        </Grid>
      </Grid>
    </Stack>
  );
}
