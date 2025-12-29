import * as React from "react";
import { useSelector } from "react-redux";
import {
  Alert,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
  Link,
} from "@mui/material";
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
import { formatDateTime } from "../shared/utils/dateTime.util";
import { getEvents } from "../store/slices/events.slice";
import { getListingsMeta } from "../store/slices/listingsMeta.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { getSalesMeta } from "../store/slices/salesMeta.slice";
import { getSales } from "../store/slices/sales.slice";
import { useListingsChartData, useSalesChartData } from "../hooks/useChartData";
import {
  getDefaultInterval,
  INTERVAL_OPTIONS_MAP,
  LISTINGS_META_CHART_CONFIG,
  SALES_META_CHART_CONFIG,
  TIME_RANGE_OPTIONS,
} from "../shared/constants/components.constants";
import DynamicChart from "../components/common/charts/DynamicChart";

export default function EventsPage() {
  const dispatch = useAppDispatch();
  const chartRef = React.useRef<HTMLDivElement>(null);

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

  const {
    rows: { data: sales, total: salesTotal },
    loading: salesLoading,
    error: salesErr,
  } = useSelector((state: RootState) => state.sales);

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
        value: moment().toISOString(),
      },
      {
        field: "localDate",
        operator: "onOrBefore",
        value: moment().add(6, "months").toISOString(),
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

  // ------------------------
  // Sales Grid State
  // ------------------------
  const [salesPaginationModel, setSalesPaginationModel] =
    React.useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [salesSortModel, setSalesSortModel] = React.useState<GridSortModel>([
    { field: "purchaseUtc", sort: "desc" },
  ]);
  const [salesFilterModel, setSalesFilterModel] =
    React.useState<GridFilterModel>({
      items: [],
    });

  React.useEffect(() => {
    setIntervalGraphOne(getDefaultInterval(timeRangeGraphOne));
  }, [timeRangeGraphOne]);

  React.useEffect(() => {
    setIntervalGraphTwo(getDefaultInterval(timeRangeGraphTwo));
  }, [timeRangeGraphTwo]);

  React.useEffect(() => {
    setIntervalGraphThree(getDefaultInterval(timeRangeGraphThree));
  }, [timeRangeGraphThree]);

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

  const handleSalesRefresh = React.useCallback(() => {
    if (!selectedEvent) return;

    const seatgeekMatch = selectedEvent.matches?.find(
      (m: any) => m.providerName === "seatgeek"
    );

    const salesFilters = {
      items: [
        { field: "eventId", operator: "equals", value: seatgeekMatch?.eventId },
        ...salesFilterModel.items,
      ],
    };

    dispatch(
      getSales({
        filters: salesFilters,
        page: salesPaginationModel.page,
        pageSize: salesPaginationModel.pageSize,
        sortFields: salesSortModel,
      })
    );
  }, [
    dispatch,
    selectedEvent,
    salesPaginationModel,
    salesSortModel,
    salesFilterModel,
  ]);

  React.useEffect(() => {
    if (!selectedEvent) return;

    const seatgeekMatch = selectedEvent.matches?.find(
      (m: any) => m.providerName === "seatgeek"
    );

    const salesFilters = {
      items: [
        { field: "eventId", operator: "equals", value: seatgeekMatch?.eventId },
        ...salesFilterModel.items,
      ],
    };

    dispatch(
      getSales({
        filters: salesFilters,
        page: salesPaginationModel.page,
        pageSize: salesPaginationModel.pageSize,
        sortFields: salesSortModel,
      })
    );
  }, [
    dispatch,
    selectedEvent,
    salesPaginationModel,
    salesSortModel,
    salesFilterModel,
  ]);

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
  // Fetch listingsMeta and salesMeta for selected event (initial load + auto-refresh)
  // ------------------------
  React.useEffect(() => {
    if (!selectedEvent) return;

    const listingsMetaFilters = {
      items: [
        { field: "eventId", operator: "equals", value: selectedEvent.eventId },
      ],
    };

    // Find seatgeek match for sales data
    const seatgeekMatch = selectedEvent.matches?.find(
      (m: any) => m.providerName === "seatgeek"
    );

    const salesMetaFilters = {
      items: [
        { field: "eventId", operator: "equals", value: seatgeekMatch?.eventId },
      ],
    };

    const salesFilters = {
      items: [
        { field: "eventId", operator: "equals", value: seatgeekMatch?.eventId },
        ...salesFilterModel.items,
      ],
    };

    // ✅ Call immediately once
    dispatch(
      getListingsMeta({ filters: listingsMetaFilters, page: -1, pageSize: -1 })
    );
    dispatch(
      getSalesMeta({ filters: salesMetaFilters, page: -1, pageSize: -1 })
    );
    dispatch(
      getSales({
        filters: salesFilters,
        page: salesPaginationModel.page,
        pageSize: salesPaginationModel.pageSize,
        sortFields: salesSortModel,
      })
    );

    // ✅ Then call every 10 minutes (only listings and sales meta, not sales data)
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
  // Fetch sales data when sales table state changes
  // ------------------------
  React.useEffect(() => {
    if (!selectedEvent) return;

    const seatgeekMatch = selectedEvent.matches?.find(
      (m: any) => m.providerName === "seatgeek"
    );

    const salesFilters = {
      items: [
        { field: "eventId", operator: "equals", value: seatgeekMatch?.eventId },
        ...salesFilterModel.items,
      ],
    };

    dispatch(
      getSales({
        filters: salesFilters,
        page: salesPaginationModel.page,
        pageSize: salesPaginationModel.pageSize,
        sortFields: salesSortModel,
      })
    );
  }, [selectedEvent, dispatch]);

  // ------------------------
  // Chart Data using custom hooks
  // ------------------------
  const datasetOne = useListingsChartData(
    listingsMeta || [],
    timeRangeGraphOne,
    intervalGraphOne
  );

  const datasetTwo = useListingsChartData(
    listingsMeta || [],
    timeRangeGraphTwo,
    intervalGraphTwo
  );

  const datasetThree = useSalesChartData(
    salesMeta || [],
    timeRangeGraphThree,
    intervalGraphThree
  );

  // Sales data grid columns
  const salesColumns: CustomGridColDef[] = [
    {
      field: "purchaseUtc",
      headerName: "Date & Time",
      flex: 1.2,
      minWidth: 170,
      type: "dateTime",
      valueFormatter: (value) => (value ? formatDateTime(value) : "-"),
    },
    {
      field: "section",
      headerName: "Section",
      flex: 0.8,
      minWidth: 100,
      type: "string",
    },
    {
      field: "row",
      headerName: "Row",
      flex: 0.8,
      minWidth: 100,
      type: "string",
    },
    {
      field: "broadcastPrice",
      headerName: "Price",
      flex: 1,
      minWidth: 130,
      min: 0,
      max: 20000,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" && value >= 0 ? `$${value.toFixed(2)}` : "-",
    },
    {
      field: "quantity",
      headerName: "Quantity",
      flex: 0.8,
      minWidth: 100,
      min: 0,
      max: 100,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" && value >= 0 ? value.toString() : "-",
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
      minWidth: 100,
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
      headerName: "Event Date & Time",
      type: "dateTime",
      flex: 1.2,
      minWidth: 180,
      valueFormatter: (value) =>
        value ? formatDateTime(moment.parseZone(value)) : "-",
      renderEditCell: (params) => (
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <DateTimePicker
            value={params.value ? moment(params.value) : moment()}
            onChange={(value) =>
              params.api.setEditCellValue({
                id: params.id,
                field: params.field,
                value: value,
              })
            }
            minDateTime={moment()} // prevent past selection
          />
        </LocalizationProvider>
      ),
    },
    // TODO AGGIGATE VENUE
    {
      field: "venueDBId",
      headerName: "Venue",
      flex: 1.5,
      minWidth: 200,
      valueGetter: (value: any) =>
        value
          ? `${value.name}, ${value.city}, ${value.stateCode} (${value.countryCode})`
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
                          ? formatDateTime(
                              moment.parseZone(selectedEvent.localDate)
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

            {/* GRAPH 1 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DynamicChart
                title="Listings Trends"
                dataset={datasetOne}
                chartConfig={LISTINGS_META_CHART_CONFIG}
                loading={listingsMetaLoading}
                timeRange={timeRangeGraphOne}
                interval={intervalGraphOne}
                onTimeRangeChange={setTimeRangeGraphOne}
                onIntervalChange={setIntervalGraphOne}
                timeRangeOptions={TIME_RANGE_OPTIONS}
                intervalOptionsMap={INTERVAL_OPTIONS_MAP}
                height={400}
              />
            </Grid>

            {/* GRAPH 2 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DynamicChart
                title="Listings Trends"
                dataset={datasetTwo}
                chartConfig={LISTINGS_META_CHART_CONFIG}
                loading={listingsMetaLoading}
                timeRange={timeRangeGraphTwo}
                interval={intervalGraphTwo}
                onTimeRangeChange={setTimeRangeGraphTwo}
                onIntervalChange={setIntervalGraphTwo}
                timeRangeOptions={TIME_RANGE_OPTIONS}
                intervalOptionsMap={INTERVAL_OPTIONS_MAP}
                height={400}
              />
            </Grid>

            {/* GRAPH 3 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DynamicChart
                title="Sales Trends"
                dataset={datasetThree}
                chartConfig={SALES_META_CHART_CONFIG}
                loading={salesMetaLoading}
                timeRange={timeRangeGraphThree}
                interval={intervalGraphThree}
                onTimeRangeChange={setTimeRangeGraphThree}
                onIntervalChange={setIntervalGraphThree}
                timeRangeOptions={TIME_RANGE_OPTIONS}
                intervalOptionsMap={INTERVAL_OPTIONS_MAP}
                height={400}
              />
            </Grid>

            {/* SALES DATA GRID */}
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomDataGrid
                title="Sales Data"
                rows={sales || []}
                rowCount={salesTotal || 0}
                columns={salesColumns}
                isLoading={salesLoading}
                error={salesErr}
                paginationModel={salesPaginationModel}
                setPaginationModel={setSalesPaginationModel}
                sortingModel={salesSortModel}
                setSortingModel={setSalesSortModel}
                filterModel={salesFilterModel}
                setFilterModel={setSalesFilterModel}
                defaultFilterType="header"
                onRefresh={handleSalesRefresh}
                height={400}
                headerComponent={
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {"Sales Data"}
                  </Typography>
                }
              />
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
