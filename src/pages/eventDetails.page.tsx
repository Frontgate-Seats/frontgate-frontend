import * as React from "react";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  IconButton,
  Tooltip,
  Link,
  Button,
  Chip,
  Box,
} from "@mui/material";
import { Edit, PlayArrow, Stop } from "@mui/icons-material";
import moment from "moment";
import type {
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from "@mui/x-data-grid";

import { formatDateTime } from "../shared/utils/dateTime.util";
import { useAppDispatch } from "../store/reducers/root.reducer";
import type { RootState } from "../store";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { getSuggests, updateSuggest } from "../store/slices/suggests.slice";
import {
  startEventMonitoring,
  stopEventMonitoring,
} from "../store/slices/events.slice";
import { getAvailability } from "../store/slices/availability.slice";
import type { UpdateSuggestPayload } from "../apis/suggests.api";
import { useClientFilters } from "../hooks/useClientFilters";
import { useChartState } from "../hooks/useChartState";
import { useEventData } from "../hooks/useEventData";
import {
  INTERVAL_OPTIONS_MAP,
  SALES_TRENDS_CHART_CONFIG,
  LISTING_TRENDS_SHORT_CHART_CONFIG,
  LISTING_TRENDS_LONG_CHART_CONFIG,
  AVAILABILITY_CHART_CONFIG,
  AVAILABILITY_SECTION_CHART_CONFIG,
  AVAILABILITY_PRICE_CHART_CONFIG,
  TIME_RANGE_OPTIONS,
} from "../shared/constants/components.constants";
import {
  generateSectionLineSeriesConfig,
  generatePricePointLineSeriesConfig,
} from "../shared/utils/chartConfig.util";
import DynamicChart from "../components/common/charts/DynamicChart";
import {
  useSalesChartData,
  useListingTrendsChartData,
  useAvailabilityCapacityChartData,
  useAvailabilitySectionChartData,
  useAvailabilityPriceChartData,
} from "../hooks/useChartData";
import {
  ConfirmDialog,
  StartMonitoringDialog,
  SuggestionDialog,
  type MonitorLevel,
} from "../components/common/dialogs";

export default function EventDetailsPage() {
  const dispatch = useAppDispatch();
  const { eventId } = useParams<{ eventId: string }>();

  // Logo paths
  const TJ_LOGO =
    "https://aibuying.frontgateseats.com/storage/v1/object/public/frontgate-frontend/tj-logo.ico";
  const VIVID_LOGO =
    "https://aibuying.frontgateseats.com/storage/v1/object/public/frontgate-frontend/vivid-logo.ico";
  const SEATGEEK_LOGO =
    "https://aibuying.frontgateseats.com/storage/v1/object/public/frontgate-frontend/seatgeek-logo.ico";

  // Fetch event-related data (excluding suggests - handled separately for server-side rendering)
  const {
    selectedEvent,
    matchedSeatGeekEvent,
    sales,
    listingTrends,
    loading,
    error,
    refetch,
  } = useEventData(eventId);

  // Chart states
  const salesChart = useChartState("1d");
  const listingShortChart = useChartState("1d");
  const listingLongChart = useChartState("7d");
  const availabilityChart = useChartState("6h");

  // Availability state from Redux
  const availabilityFromRedux = useSelector(
    (state: RootState) => state.availability,
  );

  // Chart datasets
  const datasetSalesGraph = useSalesChartData(
    sales || [],
    salesChart.timeRange,
    salesChart.interval,
  );

  const datasetListingShort = useListingTrendsChartData(
    listingTrends || [],
    listingShortChart.timeRange,
    listingShortChart.interval,
  );

  const datasetListingLong = useListingTrendsChartData(
    listingTrends || [],
    listingLongChart.timeRange,
    listingLongChart.interval,
  );

  const datasetAvailabilityCapacity = useAvailabilityCapacityChartData(
    availabilityFromRedux.data,
    availabilityChart.timeRange,
    availabilityChart.interval,
  );

  const datasetAvailabilitySection = useAvailabilitySectionChartData(
    availabilityFromRedux.data,
    availabilityChart.timeRange,
    availabilityChart.interval,
  );

  const datasetAvailabilityPrice = useAvailabilityPriceChartData(
    availabilityFromRedux.data,
    availabilityChart.timeRange,
    availabilityChart.interval,
  );

  // Generate dynamic chart configs for sections and price points
  const sectionChartConfig = React.useMemo(
    () => ({
      ...AVAILABILITY_SECTION_CHART_CONFIG,
      lineSeries: generateSectionLineSeriesConfig(datasetAvailabilitySection),
    }),
    [datasetAvailabilitySection],
  );

  const priceChartConfig = React.useMemo(
    () => ({
      ...AVAILABILITY_PRICE_CHART_CONFIG,
      lineSeries: generatePricePointLineSeriesConfig(datasetAvailabilityPrice),
    }),
    [datasetAvailabilityPrice],
  );

  // Suggests server-side state
  const suggestsFromRedux = useSelector((state: RootState) => state.suggests);
  const [suggestsPaginationModel, setSuggestsPaginationModel] =
    React.useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [suggestsSortModel, setSuggestsSortModel] =
    React.useState<GridSortModel>([{ field: "created_at", sort: "desc" }]);
  const [suggestsFilterModel, setSuggestsFilterModel] =
    React.useState<GridFilterModel>({
      items: [{ field: "llm_type", operator: "equals", value: "event-signal" }],
    });

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingSuggest, setEditingSuggest] = React.useState<any>(null);
  const [editComment, setEditComment] = React.useState("");
  const [editScore, setEditScore] = React.useState<number | null>(null);

  // Monitor Dialog State
  const [confirmStopDialog, setConfirmStopDialog] = React.useState(false);
  const [startMonitorDialog, setStartMonitorDialog] = React.useState(false);

  const isMonitoring = selectedEvent?.is_monitored || false;
  const monitorLevel = selectedEvent?.monitor_level || "none";

  // Edit Dialog Handlers
  const handleOpenEditDialog = (suggest: any) => {
    setEditingSuggest(suggest);
    setEditComment(suggest.llm_result_comment);
    setEditScore(suggest.llm_result_score);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingSuggest(null);
    setEditComment("");
    setEditScore(null);
  };

  const handleSaveEdit = async () => {
    if (!editingSuggest || !eventId) return;

    const payload: UpdateSuggestPayload = {
      id: editingSuggest.id,
      llm_result_comment: editComment,
      llm_result_score: editScore,
    };

    await dispatch(
      updateSuggest({
        payload,
        queryOptions: {
          page: suggestsPaginationModel.page,
          pageSize: suggestsPaginationModel.pageSize,
          sortFields: suggestsSortModel,
          filters: {
            items: [
              { field: "event_id", operator: "equals", value: eventId },
              ...suggestsFilterModel.items,
            ],
          },
        },
      }),
    );

    handleCloseEditDialog();
  };

  // Fetch suggests with server-side pagination/sorting/filtering
  React.useEffect(() => {
    if (!eventId) return;

    dispatch(
      getSuggests({
        page: suggestsPaginationModel.page,
        pageSize: suggestsPaginationModel.pageSize,
        sortFields: suggestsSortModel,
        filters: {
          items: [
            { field: "event_id", operator: "equals", value: eventId },
            ...suggestsFilterModel.items,
          ],
        },
      }),
    );
  }, [
    dispatch,
    eventId,
    suggestsPaginationModel.page,
    suggestsPaginationModel.pageSize,
    suggestsSortModel,
    suggestsFilterModel,
  ]);

  // Fetch availability data
  React.useEffect(() => {
    if (!eventId) return;

    // Map time range to hours
    const hoursMap: Record<string, number> = {
      "6h": 6,
      "12h": 12,
      "24h": 24,
      "48h": 48,
      "7d": 168,
    };

    const lastHoursCount = hoursMap[availabilityChart.timeRange] || 24;
    dispatch(getAvailability({ eventId, lastHoursCount }));
  }, [dispatch, eventId, availabilityChart.timeRange]);

  const handleRefreshSuggests = React.useCallback(() => {
    if (!eventId) return;

    dispatch(
      getSuggests({
        page: suggestsPaginationModel.page,
        pageSize: suggestsPaginationModel.pageSize,
        sortFields: suggestsSortModel,
        filters: {
          items: [
            { field: "event_id", operator: "equals", value: eventId },
            ...suggestsFilterModel.items,
          ],
        },
      }),
    );
  }, [
    dispatch,
    eventId,
    suggestsPaginationModel.page,
    suggestsPaginationModel.pageSize,
    suggestsSortModel,
    suggestsFilterModel,
  ]);

  // Monitor Handlers
  const handleStartMonitor = () => {
    setStartMonitorDialog(true);
  };

  const handleConfirmStartMonitor = async (level: MonitorLevel) => {
    if (!eventId) return;
    await dispatch(
      startEventMonitoring({
        eventId,
        monitorLevel: level,
      }),
    );
    setStartMonitorDialog(false);
    // Refetch event to get updated monitor status
    refetch.event();
  };

  const handleStopMonitor = () => {
    setConfirmStopDialog(true);
  };

  const handleConfirmStopMonitor = async () => {
    if (!eventId) return;
    await dispatch(stopEventMonitoring({ eventId }));
    setConfirmStopDialog(false);
    // Refetch event to get updated monitor status
    refetch.event();
  };

  const getMonitorLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  // Sales Data Grid Columns
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

  // Sales Grid State
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
  });

  // Suggests Data Grid Columns (server-side rendering - no valueGetter for nested fields)
  const suggestsColumns: CustomGridColDef[] = [
    {
      field: "action",
      headerName: "Action",
      minWidth: 100,
      flex: 1,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) => row?.llm_result?.action ?? "-",
    },
    {
      field: "section",
      headerName: "Section",
      minWidth: 150,
      flex: 1,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) => row?.llm_result?.section ?? "-",
    },
    {
      field: "confidence_level",
      headerName: "Confidence",
      minWidth: 120,
      flex: 1,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) =>
        row?.llm_result?.confidence_level ?? "-",
    },
    {
      field: "reasoning",
      headerName: "Reasoning",
      minWidth: 300,
      flex: 2,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) => row?.llm_result?.reasoning ?? "-",
    },
    {
      field: "llm_result_comment",
      headerName: "Comment",
      minWidth: 200,
      flex: 1,
      type: "string",
    },
    {
      field: "llm_result_score",
      headerName: "Score",
      minWidth: 100,
      flex: 1,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" ? value.toString() : "-",
    },
    {
      field: "created_at",
      headerName: "Date & Time",
      minWidth: 180,
      flex: 1,
      type: "dateTime",
      valueGetter: (value) => (value ? new Date(value) : null),
      valueFormatter: (value) => (value ? formatDateTime(value) : "-"),
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
        return (
          <IconButton
            onClick={() => handleOpenEditDialog(params.row)}
            size="small"
            aria-label="Edit suggestion"
          >
            <Edit />
          </IconButton>
        );
      },
    },
  ];

  // Custom header components with logos
  const salesHeaderComponent = (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Tooltip title="SeatGeek">
        <Box
          component="img"
          src={SEATGEEK_LOGO}
          alt="SeatGeek Logo"
          sx={{
            width: 24,
            height: 24,
            objectFit: "contain",
          }}
        />
      </Tooltip>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Sales Data
      </Typography>
    </Stack>
  );

  const suggestionsHeaderComponent = (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Suggestions
      </Typography>
    </Stack>
  );

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
        {/* Header with Back Button */}
        <Grid size={{ xs: 12 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Typography variant="h4" fontWeight="bold">
              Event Details
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              {monitorLevel !== "none" && (
                <Chip
                  label={`Monitor: ${monitorLevel.charAt(0).toUpperCase() + monitorLevel.slice(1)}`}
                  color={getMonitorLevelColor(monitorLevel)}
                  size="medium"
                />
              )}
              <Button
                variant={isMonitoring ? "outlined" : "contained"}
                color={isMonitoring ? "error" : "primary"}
                startIcon={isMonitoring ? <Stop /> : <PlayArrow />}
                onClick={isMonitoring ? handleStopMonitor : handleStartMonitor}
                size="small"
              >
                {isMonitoring ? "Stop" : "Start"}
              </Button>
            </Stack>
          </Stack>
        </Grid>

        {/* Combined Event Details Card */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={3}>
                {/* Vivid Seats Row */}
                <Stack direction="row" spacing={4}>
                  {/* Logo on left */}
                  <Box>
                    <Tooltip title="Vivid Seats">
                      <Box
                        component="img"
                        src={VIVID_LOGO}
                        alt="Vivid Seats logo"
                        sx={{
                          width: 24,
                          height: 24,
                          objectFit: "contain",
                        }}
                      />
                    </Tooltip>
                  </Box>

                  {/* Event details on right */}
                  <Box flex={1}>
                    <Stack
                      direction="row"
                      spacing={3}
                      sx={{
                        flexWrap: "wrap",
                        gap: 4,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Event ID
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent?.id ? (
                            selectedEvent?.web_path ? (
                              <Link
                                href={`https://www.vividseats.com${selectedEvent.web_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                                color="primary"
                              >
                                {selectedEvent.id}
                              </Link>
                            ) : (
                              selectedEvent.id
                            )
                          ) : (
                            "-"
                          )}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent?.name || "-"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Date & Time
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent?.local_date
                            ? formatDateTime(
                                moment.parseZone(selectedEvent.local_date),
                              )
                            : "-"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Venue
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent?.venue_name
                            ? `${selectedEvent.venue_name}, ${selectedEvent.venue_city}, ${selectedEvent.venue_state}`
                            : "-"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Performer
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent?.primary_performer_name || "-"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Category
                        </Typography>
                        <Typography variant="body1">
                          {selectedEvent?.category_name || "-"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>

                {/* SeatGeek Row */}
                <Stack direction="row" spacing={4}>
                  {/* Logo on left */}
                  <Box>
                    <Tooltip title="SeatGeek">
                      <Box
                        component="img"
                        src={SEATGEEK_LOGO}
                        alt="SeatGeek logo"
                        sx={{
                          width: 24,
                          height: 24,
                          objectFit: "contain",
                        }}
                      />
                    </Tooltip>
                  </Box>

                  {/* Event details on right */}
                  {matchedSeatGeekEvent ? (
                    <Box flex={1}>
                      <Stack
                        direction="row"
                        spacing={3}
                        sx={{
                          flexWrap: "wrap",
                          gap: 4,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Event ID
                          </Typography>
                          <Typography variant="body1">
                            <Link
                              href={
                                matchedSeatGeekEvent.web_path.startsWith("http")
                                  ? matchedSeatGeekEvent.web_path
                                  : `https://seatgeek.com${matchedSeatGeekEvent.web_path}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="hover"
                              color="primary"
                            >
                              {matchedSeatGeekEvent.id}
                            </Link>
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Name
                          </Typography>
                          <Typography variant="body1">
                            {matchedSeatGeekEvent?.name || "-"}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Date & Time
                          </Typography>
                          <Typography variant="body1">
                            {matchedSeatGeekEvent?.local_date
                              ? formatDateTime(
                                  moment.parseZone(
                                    matchedSeatGeekEvent.local_date,
                                  ),
                                )
                              : "-"}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Venue
                          </Typography>
                          <Typography variant="body1">
                            {matchedSeatGeekEvent?.venue_name
                              ? `${matchedSeatGeekEvent.venue_name}, ${matchedSeatGeekEvent.venue_city}, ${matchedSeatGeekEvent.venue_state}`
                              : "-"}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Performer
                          </Typography>
                          <Typography variant="body1">
                            {matchedSeatGeekEvent?.primary_performer_name ||
                              "-"}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Category
                          </Typography>
                          <Typography variant="body1">
                            {matchedSeatGeekEvent?.category_name || "-"}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ) : (
                    <></>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Primary Market Availability - Capacity Over Time */}
        <Grid size={{ xs: 12 }}>
          <DynamicChart
            title="Primary Market Availability - Capacity Trends"
            dataset={datasetAvailabilityCapacity}
            chartConfig={AVAILABILITY_CHART_CONFIG}
            loading={availabilityFromRedux.loading}
            timeRange={availabilityChart.timeRange}
            interval={availabilityChart.interval}
            onTimeRangeChange={availabilityChart.setTimeRange}
            onIntervalChange={availabilityChart.setInterval}
            timeRangeOptions={[
              { value: "1h", label: "Last 1 Hour" },
              { value: "3h", label: "Last 3 Hours" },
              { value: "6h", label: "Last 6 Hours" },
              { value: "12h", label: "Last 12 Hours" },
              { value: "1d", label: "Last Day" },
            ]}
            intervalOptionsMap={{
              "1h": ["5m", "10m", "15m"],
              "3h": ["10m", "15m", "30m", "1h"],
              "6h": ["30m", "1h", "2h"],
              "12h": ["1h", "2h", "3h"],
              "1d": ["1h", "3h", "6h"],
            }}
            height={400}
            logo={TJ_LOGO}
          />
        </Grid>

        {/* Primary Market Availability - Section Breakdown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DynamicChart
            title="Top 10 Sections - Availability Trends"
            dataset={datasetAvailabilitySection}
            chartConfig={sectionChartConfig}
            loading={availabilityFromRedux.loading}
            timeRange={availabilityChart.timeRange}
            interval={availabilityChart.interval}
            onTimeRangeChange={availabilityChart.setTimeRange}
            onIntervalChange={availabilityChart.setInterval}
            timeRangeOptions={[]}
            intervalOptionsMap={{}}
            height={400}
            logo={TJ_LOGO}
          />
        </Grid>

        {/* Primary Market Availability - Price Point Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DynamicChart
            title="Top 10 Price Points - Availability Trends"
            dataset={datasetAvailabilityPrice}
            chartConfig={priceChartConfig}
            loading={availabilityFromRedux.loading}
            timeRange={availabilityChart.timeRange}
            interval={availabilityChart.interval}
            onTimeRangeChange={availabilityChart.setTimeRange}
            onIntervalChange={availabilityChart.setInterval}
            timeRangeOptions={[]}
            intervalOptionsMap={{}}
            height={400}
            logo={TJ_LOGO}
          />
        </Grid>

        {/* Listing Trends - Short Term */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DynamicChart
            title="Listing Trends (Short-term)"
            dataset={datasetListingShort}
            chartConfig={LISTING_TRENDS_SHORT_CHART_CONFIG}
            loading={loading.listingTrends}
            timeRange={listingShortChart.timeRange}
            interval={listingShortChart.interval}
            onTimeRangeChange={listingShortChart.setTimeRange}
            onIntervalChange={listingShortChart.setInterval}
            timeRangeOptions={TIME_RANGE_OPTIONS}
            intervalOptionsMap={INTERVAL_OPTIONS_MAP}
            height={400}
            logo={VIVID_LOGO}
          />
        </Grid>

        {/* Listing Trends - Long Term */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DynamicChart
            title="Listing Trends (Long-term)"
            dataset={datasetListingLong}
            chartConfig={LISTING_TRENDS_LONG_CHART_CONFIG}
            loading={loading.listingTrends}
            timeRange={listingLongChart.timeRange}
            interval={listingLongChart.interval}
            onTimeRangeChange={listingLongChart.setTimeRange}
            onIntervalChange={listingLongChart.setInterval}
            timeRangeOptions={TIME_RANGE_OPTIONS}
            intervalOptionsMap={INTERVAL_OPTIONS_MAP}
            height={400}
            logo={VIVID_LOGO}
          />
        </Grid>

        {/* Sales Trends */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DynamicChart
            title="Sales Trends"
            dataset={datasetSalesGraph}
            chartConfig={SALES_TRENDS_CHART_CONFIG}
            loading={loading.sales}
            timeRange={salesChart.timeRange}
            interval={salesChart.interval}
            onTimeRangeChange={salesChart.setTimeRange}
            onIntervalChange={salesChart.setInterval}
            timeRangeOptions={TIME_RANGE_OPTIONS}
            intervalOptionsMap={INTERVAL_OPTIONS_MAP}
            height={400}
            logo={SEATGEEK_LOGO}
          />
        </Grid>

        {/* Sales Data Grid */}
        <Grid size={{ xs: 12, md: 6 }}>
          <CustomDataGrid
            title="Sales Data"
            rows={paginatedSales}
            rowCount={salesTotalFiltered}
            columns={salesColumns}
            isLoading={loading.sales}
            error={error.sales}
            paginationModel={salesPaginationModel}
            setPaginationModel={setSalesPaginationModel}
            sortingModel={salesSortModel}
            setSortingModel={setSalesSortModel}
            filterModel={salesFilterModel}
            setFilterModel={setSalesFilterModel}
            defaultFilterType="header"
            onRefresh={refetch.sales}
            height={400}
            headerComponent={salesHeaderComponent}
            logo={SEATGEEK_LOGO}
          />
        </Grid>

        {/* Suggests Data Grid */}
        <Grid size={{ xs: 12 }}>
          <CustomDataGrid
            title="Suggestions"
            rows={suggestsFromRedux.rows.data}
            rowCount={suggestsFromRedux.rows.total}
            columns={suggestsColumns}
            isLoading={suggestsFromRedux.loading}
            error={suggestsFromRedux.error}
            paginationModel={suggestsPaginationModel}
            setPaginationModel={setSuggestsPaginationModel}
            sortingModel={suggestsSortModel}
            setSortingModel={setSuggestsSortModel}
            filterModel={suggestsFilterModel}
            setFilterModel={setSuggestsFilterModel}
            onRefresh={handleRefreshSuggests}
            height={400}
            headerComponent={suggestionsHeaderComponent}
          />
        </Grid>
      </Grid>

      {/* Edit Suggestion Dialog */}
      <SuggestionDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        suggestion={editingSuggest}
        comment={editComment}
        score={editScore}
        onCommentChange={setEditComment}
        onScoreChange={setEditScore}
        onSubmit={handleSaveEdit}
      />

      {/* Stop Monitor Confirmation Dialog */}
      <ConfirmDialog
        open={confirmStopDialog}
        onClose={() => setConfirmStopDialog(false)}
        onConfirm={handleConfirmStopMonitor}
        title="Stop Monitoring Event?"
        message={
          <>
            Are you sure you want to stop monitoring "{selectedEvent?.name}"?
            <br />
            <br />
            This will disable automated monitoring and alerts for this event.
          </>
        }
        confirmLabel="Stop Monitoring"
        cancelLabel="Cancel"
        confirmColor="error"
      />

      {/* Start Monitor Dialog */}
      <StartMonitoringDialog
        open={startMonitorDialog}
        eventName={selectedEvent?.name || null}
        onClose={() => setStartMonitorDialog(false)}
        onConfirm={handleConfirmStartMonitor}
      />
    </Stack>
  );
}
