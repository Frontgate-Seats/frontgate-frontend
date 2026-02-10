import * as React from "react";
import { useSelector } from "react-redux";
import {
  Alert,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
  Link,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { BarChart, MoreVert, Visibility, PlayArrow, Stop } from "@mui/icons-material";
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
import { getEvents, startEventMonitoring, stopEventMonitoring } from "../store/slices/events.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { getSales } from "../store/slices/sales.slice";
import { getEventsExternalMappings } from "../store/slices/eventsExternalMappings.slice";
import { getListingTrends } from "../store/slices/listingTrends.slice";
import { useClientFilters } from "../hooks/useClientFilters";
import {
  getDefaultInterval,
  INTERVAL_OPTIONS_MAP,
  SALES_TRENDS_CHART_CONFIG,
  LISTING_TRENDS_SHORT_CHART_CONFIG,
  LISTING_TRENDS_LONG_CHART_CONFIG,
  TIME_RANGE_OPTIONS,
} from "../shared/constants/components.constants";
import DynamicChart from "../components/common/charts/DynamicChart";
import { useSalesChartData, useListingTrendsChartData } from "../hooks/useChartData";
import { ConfirmDialog } from "../components/common/dialogs";

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
    rows: { data: sales },
    loading: salesLoading,
    error: salesErr,
  } = useSelector((state: RootState) => state.sales);
  const {
    rows: { data: eventsExternalMappings },
  } = useSelector((state: RootState) => state.eventsExternalMappings);
  const {
    rows: { data: listingTrends },
    loading: listingTrendsLoading,
  } = useSelector((state: RootState) => state.listingTrends);

  // ------------------------
  // Grid State
  // ------------------------
  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: "local_date", sort: "asc" },
  ]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [
      {
        field: "local_date",
        operator: "onOrAfter",
        value: moment().toISOString(),
      },
      {
        field: "local_date",
        operator: "onOrBefore",
        value: moment().add(6, "months").toISOString(),
      },
    ],
  });

  // ------------------------
  // Sales Chart State
  // ------------------------
  const [timeSalesGraph, setTimeSalesGraph] = React.useState("1d");
  const [intervalSalesGraph, setIntervalSalesGraph] = React.useState("1h");

  React.useEffect(() => {
    setIntervalSalesGraph(getDefaultInterval(timeSalesGraph));
  }, [timeSalesGraph]);

  const datasetSalesGraph = useSalesChartData(
    sales || [],
    timeSalesGraph,
    intervalSalesGraph,
  );

  // ------------------------
  // Listing Trends Chart State (Short-term)
  // ------------------------
  const [timeListingShort, setTimeListingShort] = React.useState("1d");
  const [intervalListingShort, setIntervalListingShort] = React.useState("1h");

  React.useEffect(() => {
    setIntervalListingShort(getDefaultInterval(timeListingShort));
  }, [timeListingShort]);

  const datasetListingShort = useListingTrendsChartData(
    listingTrends || [],
    timeListingShort,
    intervalListingShort,
  );

  // ------------------------
  // Listing Trends Chart State (Long-term)
  // ------------------------
  const [timeListingLong, setTimeListingLong] = React.useState("7d");
  const [intervalListingLong, setIntervalListingLong] = React.useState("3h");

  React.useEffect(() => {
    setIntervalListingLong(getDefaultInterval(timeListingLong));
  }, [timeListingLong]);

  const datasetListingLong = useListingTrendsChartData(
    listingTrends || [],
    timeListingLong,
    intervalListingLong,
  );

  // ------------------------
  // Selected Event State
  // ------------------------
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);

  // ------------------------
  // Confirmation Dialog State
  // ------------------------
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    eventId: string | null;
    eventName: string | null;
  }>({
    open: false,
    eventId: null,
    eventName: null,
  });

  // ------------------------
  // Sales Data Grid Columns
  // ------------------------
  const salesColumns: CustomGridColDef[] = [
    {
      field: "purchased_at",
      headerName: "Date & Time",
      minWidth: 120,
      flex: 1,
      type: "dateTime",
      valueFormatter: (value) => (value ? formatDateTime(value) : "-"),
    },
    {
      field: "section_name",
      headerName: "Section",
      flex: 1,
      minWidth: 100,
      type: "string",
    },
    {
      field: "row_name",
      headerName: "Row",
      flex: 1,
      minWidth: 100,
      type: "string",
    },
    {
      field: "base_price",
      headerName: "Price",
      minWidth: 120,
      min: 0,
      flex: 1,
      max: 20000,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" && value >= 0 ? `${value.toFixed(2)}` : "-",
    },
    {
      field: "quantity",
      headerName: "Quantity",
      minWidth: 80,
      flex: 1,
      min: 0,
      max: 1000,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" && value >= 0 ? value.toString() : "-",
    },
  ];

  // ------------------------
  // Sales Grid State
  // ------------------------
  const {
    paginationModel: salesPaginationModel,
    sortModel: salesSortModel,
    filterModel: salesFilterModel,
    setPaginationModel: setSalesPaginationModel,
    setSortModel: setSalesSortModel,
    setFilterModel: setSalesFilterModel,
    paginatedRows: paginatedSales,
    totalFilteredRows: salesTotalFiltered,
  } = useClientFilters({
    data: sales || [],
    columns: salesColumns,
    initialPaginationModel: { page: 0, pageSize: 25 },
    initialSortModel: [{ field: "purchased_at", sort: "desc" }],
    initialFilterModel: { items: [] },
  });

  React.useEffect(() => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      }),
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handleRefresh = React.useCallback(() => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      }),
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handleConfirmStopMonitoring = () => {
    if (confirmDialog.eventId) {
      const queryOptions = {
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      };
      dispatch(stopEventMonitoring({ eventId: confirmDialog.eventId, queryOptions }));
    }
    setConfirmDialog({ open: false, eventId: null, eventName: null });
  };

  const handleCancelStopMonitoring = () => {
    setConfirmDialog({ open: false, eventId: null, eventName: null });
  };

  const handlefetchSales = React.useCallback(async () => {
    const external_event_id =
      eventsExternalMappings?.[0]?.external_event_id?.toString();

    if (!external_event_id) return;

    await dispatch(getSales(external_event_id));
  }, [dispatch, eventsExternalMappings]);

  const handlefetchListingTrends = React.useCallback(async () => {
    if (!selectedEvent?.id) return;
    await dispatch(getListingTrends(selectedEvent.id.toString()));
  }, [dispatch, selectedEvent]);

  const handlefetchEventsExternalMappings = React.useCallback(
    async (event_id: string) => {
      const externalEventMappingsFilters = {
        items: [
          {
            field: "event_id",
            operator: "equals",
            value: event_id,
          },
        ],
      };

      await dispatch(
        getEventsExternalMappings({
          filters: externalEventMappingsFilters,
        }),
      );
    },
    [dispatch],
  );

  const handleRowClick = async (row: any) => {
    if (row.id === selectedEvent?.id) return;
    await handlefetchEventsExternalMappings(row.id);
    setSelectedEvent(row);
    setTimeout(() => {
      chartRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
  };

  // ------------------------
  // Auto-fetch sales data for selected event
  // ------------------------
  React.useEffect(() => {
    if (!eventsExternalMappings?.length) return;

    const external_event_id =
      eventsExternalMappings?.[0]?.external_event_id?.toString();

    if (!external_event_id) return;

    handlefetchSales();

    const intervalId = setInterval(() => handlefetchSales(), 600000);

    return () => clearInterval(intervalId);
  }, [eventsExternalMappings, handlefetchSales]);

  // ------------------------
  // Auto-fetch listing trends for selected event
  // ------------------------
  React.useEffect(() => {
    if (!selectedEvent?.id) return;

    handlefetchListingTrends();

    const intervalId = setInterval(() => handlefetchListingTrends(), 600000);

    return () => clearInterval(intervalId);
  }, [selectedEvent, handlefetchListingTrends]);

  // ------------------------
  // Data Grid Columns
  // ------------------------
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
      field: "id",
      headerName: "Event ID",
      minWidth: 120,
      type: "number",
      headerAlign: "left",
      align: "left",
      renderCell: (params) => {
        const event = events.find((e) => e.id == params.value);
        let url;
        switch (event.platform) {
          case "vividseats":
            url = `https://www.vividseats.com${event.web_path}`;
            break;
          default:
            break;
        }
        return (
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="primary"
          >
            {params.value}
          </Link>
        );
      },
    },
    {
      field: "name",
      headerName: "Event Name",
      flex: 1,
      type: "string",
    },
    {
      field: "local_date",
      headerName: "Event Date & Time",
      type: "dateTime",
      width: 160,
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
      field: "venue_name",
      headerName: "Venue",
      flex: 0.5,
      minWidth: 120,
    },
    {
      field: "venue_city",
      headerName: "City",
      minWidth: 100,
    },
    {
      field: "venue_state",
      headerName: "State",
      minWidth: 100,
    },
    {
      field: "category_name",
      headerName: "Category",
      minWidth: 100,
      type: "singleSelect",
      valueOptions: ["Sports", "Concerts"],
    },
    {
      field: "ticket_count",
      headerName: "Tickets",
      minWidth: 100,
      type: "number",
      min: 0,
      max: 20000,
    },
    {
      field: "listing_count",
      headerName: "Listings",
      minWidth: 100,
      type: "number",
      min: 0,
      max: 20000,
    },
    {
      field: "getInPriceMedian",
      headerName: "Median Price",
      minWidth: 10,
      type: "number",
      min: 0,
      max: 20000,
      valueFormatter: (value) => (value >= 0 ? `${value}` : "-"),
    },
    {
      field: "actions",
      headerName: "Actions",
      headerAlign: "center",
      align: "center",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const eventId = params.row.id.toString();
        const isMonitoring = params.row.is_monitored || false;

        const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
        const open = Boolean(anchorEl);

        const handleClick = (event: React.MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          setAnchorEl(event.currentTarget);
        };

        const handleClose = () => {
          setAnchorEl(null);
        };

        const handleViewListings = () => {
          window.open(`/functions/v1/events-api/ui/listings/${params.row.id}`, "_blank");
          handleClose();
        };

        const handleToggleMonitoring = () => {
          const queryOptions = {
            page: paginationModel.page,
            pageSize: paginationModel.pageSize,
            sortFields: sortModel,
            filters: filterModel,
          };

          if (isMonitoring) {
            // Show confirmation dialog for stopping monitoring
            setConfirmDialog({
              open: true,
              eventId,
              eventName: params.row.name,
            });
          } else {
            // Start monitoring immediately
            dispatch(startEventMonitoring({ eventId, queryOptions }));
          }
          handleClose();
        };

        return (
          <>
            <IconButton
              onClick={handleClick}
              size="small"
              aria-controls={open ? 'actions-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <MoreVert />
            </IconButton>
            <Menu
              id="actions-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'actions-button',
              }}
            >
              <MenuItem onClick={handleViewListings}>
                <ListItemIcon>
                  <Visibility fontSize="small" />
                </ListItemIcon>
                <ListItemText>View Listings</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleToggleMonitoring}>
                <ListItemIcon>
                  {isMonitoring ? <Stop fontSize="small" /> : <PlayArrow fontSize="small" />}
                </ListItemIcon>
                <ListItemText>
                  {isMonitoring ? "Stop Monitor" : "Start Monitor"}
                </ListItemText>
              </MenuItem>
            </Menu>
          </>
        );
      },
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
                        {selectedEvent?.local_date
                          ? formatDateTime(
                              moment.parseZone(selectedEvent.local_date),
                            )
                          : ""}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Venue
                      </Typography>
                      <Typography variant="body1">
                        {`${selectedEvent?.venue_name}, ${selectedEvent?.venue_city}, ${selectedEvent?.venue_state}`}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Performer
                      </Typography>
                      <Typography variant="body1">
                        {selectedEvent?.primary_performer_name}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Listing Trends - Short Term */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DynamicChart
                title="Listing Trends (Short-term)"
                dataset={datasetListingShort}
                chartConfig={LISTING_TRENDS_SHORT_CHART_CONFIG}
                loading={listingTrendsLoading}
                timeRange={timeListingShort}
                interval={intervalListingShort}
                onTimeRangeChange={setTimeListingShort}
                onIntervalChange={setIntervalListingShort}
                timeRangeOptions={TIME_RANGE_OPTIONS}
                intervalOptionsMap={INTERVAL_OPTIONS_MAP}
                height={400}
              />
            </Grid>

            {/* Listing Trends - Long Term */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DynamicChart
                title="Listing Trends (Long-term)"
                dataset={datasetListingLong}
                chartConfig={LISTING_TRENDS_LONG_CHART_CONFIG}
                loading={listingTrendsLoading}
                timeRange={timeListingLong}
                interval={intervalListingLong}
                onTimeRangeChange={setTimeListingLong}
                onIntervalChange={setIntervalListingLong}
                timeRangeOptions={TIME_RANGE_OPTIONS}
                intervalOptionsMap={INTERVAL_OPTIONS_MAP}
                height={400}
              />
            </Grid>

            {/* Sales Trends */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DynamicChart
                title="Sales Trends"
                dataset={datasetSalesGraph}
                chartConfig={SALES_TRENDS_CHART_CONFIG}
                loading={salesLoading}
                timeRange={timeSalesGraph}
                interval={intervalSalesGraph}
                onTimeRangeChange={setTimeSalesGraph}
                onIntervalChange={setIntervalSalesGraph}
                timeRangeOptions={TIME_RANGE_OPTIONS}
                intervalOptionsMap={INTERVAL_OPTIONS_MAP}
                height={400}
              />
            </Grid>

            {/* SALES DATA GRID */}
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomDataGrid
                title="Sales Data"
                rows={paginatedSales}
                rowCount={salesTotalFiltered}
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
                onRefresh={() => {
                  handlefetchSales();
                }}
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={handleCancelStopMonitoring}
        onConfirm={handleConfirmStopMonitoring}
        title="Stop Monitoring Event?"
        message={
          <>
            Are you sure you want to stop monitoring "{confirmDialog.eventName}"?
            <br />
            <br />
            This will stop collecting listings and sales data for this event.
          </>
        }
        confirmLabel="Stop Monitoring"
        cancelLabel="Cancel"
        confirmColor="error"
        severity="warning"
      />
    </Stack>
  );
}
