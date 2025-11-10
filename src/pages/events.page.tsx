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
} from "@mui/x-charts";
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

export default function EventsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const timeRangeOptions = [
    { value: "1d", label: "Last Day" },
    { value: "7d", label: "Last Week" },
    { value: "30d", label: "Last Month" },
    { value: "3m", label: "Last 3 Months" },
    { value: "6m", label: "Last 6 Months" },
    { value: "1y", label: "Last Year" },
  ];

  const intervalOptionsMap: Record<string, string[]> = {
    "1d": ["10m", "30m", "1h", "3h", "6h"],
    "7d": ["3h", "6h", "12h", "1d", "3d"],
    "30d": ["12h", "1d", "3d", "7d", "15d"],
    "3m": ["3d", "7d", "30d"],
    "6m": ["7d", "30d", "90d"],
    "1y": ["30d", "90d", "180d"],
  };

  const defaultInterval = (range: string) => intervalOptionsMap[range][2];

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
      { field: "category", operator: "is", value: "Sports" },
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

  React.useEffect(() => {
    setInterval(defaultInterval(timeRange));
  }, [timeRange]);

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

  React.useEffect(() => {
    if (!selectedEvent) return;

    const filters = {
      items: [
        { field: "eventId", operator: "equals", value: selectedEvent.eventId },
      ],
    };

    dispatch(getListingsMeta({ filters, page: -1, pageSize: -1 }));
  }, [selectedEvent, dispatch]);

  const columns: CustomGridColDef[] = [
    {
      field: "eventId",
      headerName: "Event ID",
      flex: 0.6,
      minWidth: 100,
      type: "number",
    },
    {
      field: "name",
      headerName: "Event Name",
      flex: 1.8,
      minWidth: 180,
      type: "string",
    },
    {
      field: "utcDate",
      headerName: "Date & Time (UTC)",
      type: "dateTime",
      flex: 1.3,
      minWidth: 160,
      valueFormatter: (value) =>
        value ? moment(value).format("MM/DD/YYYY hh:mm A") : "-",
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
      minWidth: 180,
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
      flex: 0.8,
      minWidth: 100,
      type: "singleSelect",
      valueOptions: ["Sports"],
    },
    {
      field: "ticketCount",
      headerName: "Tickets",
      flex: 0.8,
      minWidth: 100,
      type: "number",
      min: 0,
      max: 20000,
    },
    {
      field: "listingCount",
      headerName: "Listings",
      flex: 0.8,
      minWidth: 100,
      type: "number",
      min: 0,
      max: 20000,
    },
    {
      field: "getInPriceMedian",
      headerName: "Median Price",
      flex: 0.9,
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
      flex: 0.7,
      minWidth: 140,
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

    const sortedData = [...listingsMeta].sort(
      (a, b) =>
        moment.utc(a.createdAt).valueOf() - moment.utc(b.createdAt).valueOf()
    );

    // find last known value BEFORE range start (for replication)
    let lastBeforeRange = null;
    for (let i = sortedData.length - 1; i >= 0; i--) {
      const t = moment.utc(sortedData[i].createdAt).valueOf();
      if (t < rangeStart) {
        lastBeforeRange = sortedData[i];
        break;
      }
    }

    // filter within range only for charting
    const rangeData = sortedData.filter((item) => {
      const t = moment.utc(item.createdAt).valueOf();
      return t >= rangeStart && t <= rangeEnd;
    });

    // group by buckets
    const grouped: Record<number, any[]> = {};
    rangeData.forEach((item) => {
      const time = moment.utc(item.createdAt).valueOf();
      const bucket = Math.floor(time / intervalMs) * intervalMs;
      if (!grouped[bucket]) grouped[bucket] = [];
      grouped[bucket].push(item);
    });

    const result: any[] = [];
    let lastValue = lastBeforeRange
      ? {
          tickets: lastBeforeRange.ticketCount ?? 0,
          priceMin: lastBeforeRange.priceMin ?? 0,
          twoPlusPriceMin: lastBeforeRange.twoPlusPriceMin ?? 0,
          getInPriceMin: lastBeforeRange.getInPriceMin ?? 0,
        }
      : {
          tickets: 0,
          priceMin: 0,
          twoPlusPriceMin: 0,
          getInPriceMin: 0,
        };

    const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
    const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const arr = grouped[t] || [];

      if (arr.length === 0) {
        // No data → replicate last known value
        result.push({
          ...lastValue,
          time: moment.utc(t).local().format("MM/DD/YYYY hh:mm A"),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      } else {
        // Average within bucket
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
          time: moment.utc(t).local().format("MM/DD/YYYY hh:mm A"),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      }
    }

    return result;
  }, [listingsMeta, interval, timeRange]);

  const lineSeries: LineSeriesType[] = [
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
                        disableTicks: true,
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
                            r={5} // bigger on hover
                            fill={isHighlighted ? color : "transparent"} // use series color automatically
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
          </>
        )}

        <Grid size={{ xs: 12 }}>
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
              onRowClick={(value) => handleRowClick(value.row)}
              onRefresh={handleRefresh}
            />
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
