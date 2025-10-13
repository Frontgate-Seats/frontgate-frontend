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
  Container,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
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
  type MarkElementProps,
} from "@mui/x-charts";
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from "@mui/x-data-grid";
import moment from "moment";

import DataGridPage from "../components/common/datagrid.comon";
import type { RootState } from "../store";
import { getEvents } from "../store/slices/events.slice";
import { getListingsMeta } from "../store/slices/listingsMeta.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";

export default function EventsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Time range options and interval mapping
  const timeRangeOptions = [
    { value: "1d", label: "Last Day" },
    { value: "7d", label: "Last Week" },
    { value: "30d", label: "Last Month" },
    { value: "3m", label: "Last 3 Months" },
    { value: "6m", label: "Last 6 Months" },
    { value: "1y", label: "Last Year" },
  ];

  const intervalOptionsMap: Record<string, string[]> = {
    "1d": ["10m", "30m", "1h", "3h"],
    "7d": ["30m", "1h", "3h", "6h"],
    "30d": ["3h", "6h", "12h", "1d"],
    "3m": ["6h", "12h", "1d", "7d"],
    "6m": ["12h", "1d", "7d", "30d"],
    "1y": ["1d", "7d", "30d", "90d", "180d"],
  };

  const defaultInterval = (range: string) =>
    intervalOptionsMap[range][intervalOptionsMap[range]?.length - 1];

  const {
    rows: { data: events, total },
    loading: eventsLoading,
    error: eventsError,
  } = useSelector((state: RootState) => state.events);

  const {
    rows: { data: listingsMeta },
    loading: listingsMetaLoading,
  } = useSelector((state: RootState) => state.listingsMeta);

  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: "utcDate", sort: "asc" },
  ]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [
      { field: "category", operator: "equals", value: "Sports" },
      {
        field: "utcDate",
        operator: "onOrAfter",
        value: moment().utc().toISOString(),
      },
    ],
  });

  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);
  const [timeRange, setTimeRange] = React.useState("1d");
  const [interval, setInterval] = React.useState(defaultInterval("1d"));

  // Update interval when timeRange changes
  React.useEffect(() => {
    setInterval(defaultInterval(timeRange));
  }, [timeRange]);

  // Fetch events
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
  };

  // Fetch listingsMeta whenever selectedEvent or timeRange changes
  React.useEffect(() => {
    if (!selectedEvent) return;

    const now = moment().utc();
    let fromDate = now.clone();

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

    const filters = {
      items: [
        { field: "eventId", operator: "equals", value: selectedEvent.eventId },
        {
          field: "createdAt",
          operator: "onOrAfter",
          value: fromDate.toISOString(),
        },
        {
          field: "createdAt",
          operator: "onOrBefore",
          value: now.toISOString(),
        },
      ],
    };

    dispatch(getListingsMeta({ filters, page: -1, pageSize: -1 }));
  }, [selectedEvent, timeRange, dispatch]);

  const columns: GridColDef[] = [
    { field: "eventId", headerName: "Event ID", flex: 0.8, minWidth: 120 },
    { field: "name", headerName: "Event Name", flex: 2, minWidth: 200 },
    {
      field: "utcDate",
      headerName: "Date & Time (UTC)",
      type: "dateTime",
      flex: 1.5,
      minWidth: 180,
      valueFormatter: (value) =>
        value ? moment(value).format("DD/MM/YYYY hh:mm A") : "-",
    },
    {
      field: "venueDBId",
      headerName: "Venue",
      flex: 2,
      minWidth: 220,
      valueGetter: (value: any) =>
        value
          ? `${value.city}, ${value.stateCode} (${value.countryCode})`
          : "-",
      filterable: false,
      sortable: false,
    },
    { field: "category", headerName: "Category", flex: 1, minWidth: 140 },
    {
      field: "ticketCount",
      headerName: "Ticket Count",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "listingCount",
      headerName: "Listing Count",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      flex: 0,
      width: 160,
      getActions: (params) => [
        <Button
          key={params.row.eventId}
          onClick={(e) => {
            e.stopPropagation();
            const url = `/listings/${params.row.eventId}`;
            if (e.ctrlKey || e.metaKey) {
              window.open(url, "_blank");
            } else {
              navigate(url);
            }
          }}
          variant="contained"
          size="small"
          sx={{ borderRadius: 2 }}
        >
          View Listings
        </Button>,
      ],
    },
  ];

  // Dataset with aligned buckets and carry-forward
  // WITH AVG
  const dataset = React.useMemo(() => {
    if (!listingsMeta || listingsMeta.length === 0) return [];

    const intervalMs = interval.endsWith("d")
      ? parseInt(interval) * 24 * 60 * 60 * 1000
      : interval.endsWith("h")
      ? parseInt(interval) * 60 * 60 * 1000
      : parseInt(interval) * 60 * 1000;

    const sortedData = [...listingsMeta].sort(
      (a, b) =>
        moment.utc(a.createdAt).valueOf() - moment.utc(b.createdAt).valueOf()
    );

    const minTime = moment.utc(sortedData[0].createdAt).valueOf();
    const maxTime = moment
      .utc(sortedData[sortedData.length - 1].createdAt)
      .valueOf();

    const startBucket = Math.floor(minTime / intervalMs) * intervalMs;
    const endBucket = Math.ceil(maxTime / intervalMs) * intervalMs;

    // Group original data by bucket for averaging
    const grouped: Record<number, any[]> = {};
    sortedData.forEach((item) => {
      const time = moment.utc(item.createdAt).valueOf();
      const bucket = Math.floor(time / intervalMs) * intervalMs;
      if (!grouped[bucket]) grouped[bucket] = [];
      grouped[bucket].push(item);
    });

    const result: any[] = [];
    let lastValue = {
      tickets: 0,
      priceMin: 0,
      twoPlusPriceMin: 0,
      getInPriceMin: 0,
    };

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const arr = grouped[t] || [];

      if (arr.length === 0) {
        // No data for this bucket → replicate last value
        result.push({
          ...lastValue,
          time: moment.utc(t).local().format("DD/MM/YYYY hh:mm A"),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      } else {
        // Compute average for this bucket
        const avg = (field: string) =>
          arr.reduce((sum, i) => sum + (i[field] ?? 0), 0) / arr.length;

        lastValue = {
          tickets: Math.round(avg("ticketCount")),
          priceMin: +avg("priceMin").toFixed(2),
          twoPlusPriceMin: +avg("twoPlusPriceMin").toFixed(2),
          getInPriceMin: +avg("getInPriceMin").toFixed(2),
        };

        result.push({
          ...lastValue,
          time: moment.utc(t).local().format("DD/MM/YYYY hh:mm A"),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      }
    }

    return result;
  }, [listingsMeta, interval]);

  // WITHOUTAVG
  //   const dataset = React.useMemo(() => {
  //   if (!listingsMeta || listingsMeta.length === 0) return [];

  //   const intervalMs = interval.endsWith("d")
  //     ? parseInt(interval) * 24 * 60 * 60 * 1000
  //     : interval.endsWith("h")
  //     ? parseInt(interval) * 60 * 60 * 1000
  //     : parseInt(interval) * 60 * 1000;

  //   const sortedData = [...listingsMeta].sort(
  //     (a, b) =>
  //       moment.utc(a.createdAt).valueOf() - moment.utc(b.createdAt).valueOf()
  //   );

  //   const minTime = moment.utc(sortedData[0].createdAt).valueOf();
  //   const maxTime = moment
  //     .utc(sortedData[sortedData.length - 1].createdAt)
  //     .valueOf();

  //   const startBucket = Math.floor(minTime / intervalMs) * intervalMs;
  //   const endBucket = Math.ceil(maxTime / intervalMs) * intervalMs;

  //   // Group original data by bucket without averaging
  //   const grouped: Record<number, any[]> = {};
  //   sortedData.forEach((item) => {
  //     const time = moment.utc(item.createdAt).valueOf();
  //     const bucket = Math.floor(time / intervalMs) * intervalMs;
  //     if (!grouped[bucket]) grouped[bucket] = [];
  //     grouped[bucket].push(item);
  //   });

  //   const result: any[] = [];
  //   let lastValue = {
  //     tickets: 0,
  //     priceMin: 0,
  //     twoPlusPriceMin: 0,
  //     getInPriceMin: 0,
  //   };

  //   for (let t = startBucket; t <= endBucket; t += intervalMs) {
  //     const arr = grouped[t] || [];

  //     if (arr.length === 0) {
  //       // No data → replicate last known value
  //       result.push({
  //         ...lastValue,
  //         time: moment.utc(t).local().format("DD/MM/YYYY hh:mm A"),
  //         bucketStartUTC: moment.utc(t).toISOString(),
  //       });
  //     } else {
  //       // Use the first entry in this bucket without averaging
  //       lastValue = {
  //         tickets: arr[0].ticketCount,
  //         priceMin: arr[0].priceMin,
  //         twoPlusPriceMin: arr[0].twoPlusPriceMin,
  //         getInPriceMin: arr[0].getInPriceMin,
  //       };

  //       result.push({
  //         ...lastValue,
  //         time: moment.utc(t).local().format("DD/MM/YYYY hh:mm A"),
  //         bucketStartUTC: moment.utc(t).toISOString(),
  //       });
  //     }
  //   }

  //   return result;
  // }, [listingsMeta, interval]);

  const leftMax = React.useMemo(
    () =>
      Math.ceil(
        Math.max(
          ...dataset.map((d) =>
            Math.max(d.priceMin, d.twoPlusPriceMin, d.getInPriceMin)
          )
        ) * 1.1
      ) || 100,
    [dataset]
  );
  const rightMax = React.useMemo(
    () =>
      Math.max(
        10,
        Math.ceil(Math.max(...dataset.map((d) => d.tickets)) * 1.1)
      ) || 10,
    [dataset]
  );

  const lineSeries: LineSeriesType[] = [
    {
      type: "line",
      label: "Min Price",
      dataKey: "priceMin",
      color: "#1976d2",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
      curve: "natural",
    },
    {
      type: "line",
      label: "Min Price 2+",
      dataKey: "twoPlusPriceMin",
      color: "#ff7043",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
      curve: "natural",
    },
    {
      type: "line",
      label: "GetIn Price Min 2+",
      dataKey: "getInPriceMin",
      color: "#26a69a",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
      curve: "natural",
    },
  ];

  const barSeries: BarSeriesType[] = [
    {
      type: "bar",
      label: "Tickets",
      dataKey: "tickets",
      color: "rgba(144,164,174,0.45)",
      yAxisId: "rightAxis",
      valueFormatter: (v) => (v != null ? `${v}` : "-"),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Grid size={{ xs: 12 }}>
        {selectedEvent && (
          <Grid container spacing={3}>
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
                              "DD/MM/YYYY hh:mm A"
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
                    flexWrap={"wrap"}
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
                          value={interval}
                          label="Interval"
                          onChange={(e) => setInterval(e.target.value)}
                          sx={{ minWidth: 120 }}
                        >
                          {intervalOptionsMap[timeRange].map((i) => (
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
                      },
                    ]}
                    yAxis={[
                      {
                        id: "leftAxis",
                        label: "Price ($)",
                        min: 0,
                        max: leftMax,
                      },
                      {
                        id: "rightAxis",
                        label: "Tickets Qty",
                        position: "right",
                        min: 0,
                        max: rightMax,
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
                            r={isHighlighted ? 5 : 3} // bigger on hover
                            fill={isHighlighted ? color : "transparent"} // use series color automatically
                            stroke={color} // optional border
                            strokeWidth={5}
                          />
                        ),
                      }}
                      slotProps={{
                        mark: {
                          shape: "circle", // default shape, required
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
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          {eventsError ? (
            <Alert severity="error">{eventsError}</Alert>
          ) : (
            <DataGridPage
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
              showToolbar
              paginationMode="server"
              sortingMode="server"
              filterMode="server"
              onRowClick={(value) => handleRowClick(value.row)}
              onRefresh={handleRefresh}
            />
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
