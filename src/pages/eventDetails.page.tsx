import * as React from "react";
import { useParams, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Link,
  Button,
  Chip,
} from "@mui/material";
import { ArrowBack, Edit, PlayArrow, Stop } from "@mui/icons-material";
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
import type { UpdateSuggestPayload } from "../apis/suggests.api";
import { useClientFilters } from "../hooks/useClientFilters";
import { useChartState } from "../hooks/useChartState";
import { useEventData } from "../hooks/useEventData";
import {
  INTERVAL_OPTIONS_MAP,
  SALES_TRENDS_CHART_CONFIG,
  LISTING_TRENDS_SHORT_CHART_CONFIG,
  LISTING_TRENDS_LONG_CHART_CONFIG,
  TIME_RANGE_OPTIONS,
} from "../shared/constants/components.constants";
import DynamicChart from "../components/common/charts/DynamicChart";
import {
  useSalesChartData,
  useListingTrendsChartData,
} from "../hooks/useChartData";
import {
  ConfirmDialog,
  StartMonitoringDialog,
  SuggestionDialog,
  type MonitorLevel,
} from "../components/common/dialogs";

export default function EventDetailsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();

  // Fetch event-related data (excluding suggests - handled separately for server-side rendering)
  const {
    selectedEvent,
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

  // Suggests server-side state
  const suggestsFromRedux = useSelector((state: RootState) => state.suggests);
  const [suggestsPaginationModel, setSuggestsPaginationModel] =
    React.useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [suggestsSortModel, setSuggestsSortModel] = React.useState<GridSortModel>([
    { field: "created_at", sort: "desc" },
  ]);
  const [suggestsFilterModel, setSuggestsFilterModel] = React.useState<GridFilterModel>({
    items: [],
  });

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingSuggest, setEditingSuggest] = React.useState<any>(null);
  const [editComment, setEditComment] = React.useState("");

  // Monitor Dialog State
  const [confirmStopDialog, setConfirmStopDialog] = React.useState(false);
  const [startMonitorDialog, setStartMonitorDialog] = React.useState(false);

  const isMonitoring = selectedEvent?.is_monitored || false;
  const monitorLevel = selectedEvent?.monitor_level || "none";

  // Edit Dialog Handlers
  const handleOpenEditDialog = (suggest: any) => {
    setEditingSuggest(suggest);
    setEditComment(suggest.llm_result_comment || "");
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingSuggest(null);
    setEditComment("");
  };

  const handleSaveEdit = async () => {
    if (!editingSuggest || !eventId) return;

    const payload: UpdateSuggestPayload = {
      id: editingSuggest.id,
      llm_result_comment: editComment,
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
      })
    );
  }, [
    dispatch,
    eventId,
    suggestsPaginationModel.page,
    suggestsPaginationModel.pageSize,
    suggestsSortModel,
    suggestsFilterModel,
  ]);

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
      })
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
      field: "llm_type",
      headerName: "Type",
      minWidth: 120,
      flex: 1,
      type: "string",
    },
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
      valueGetter: (_value: any, row: any) => row?.llm_result?.confidence_level ?? "-",
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
          <Stack direction="row" alignItems="center" spacing={2}>
            <Tooltip title="Back to Events">
              <IconButton onClick={() => navigate("/events")} color="primary">
                <ArrowBack />
              </IconButton>
            </Tooltip>
            <Typography variant="h4" fontWeight="bold">
              Event Details
            </Typography>
          </Stack>
        </Grid>

        {/* Event Details Card */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h5" fontWeight="bold">
                  {selectedEvent?.name}
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
                    onClick={
                      isMonitoring ? handleStopMonitor : handleStartMonitor
                    }
                  >
                    {isMonitoring ? "Stop Monitor" : "Start Monitor"}
                  </Button>
                </Stack>
              </Stack>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Event ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent?.platform === "vividseats" ? (
                      <Link
                        href={`https://www.vividseats.com${selectedEvent?.web_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        color="primary"
                      >
                        {selectedEvent?.id}
                      </Link>
                    ) : (
                      selectedEvent?.id
                    )}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Venue
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent?.venue_name
                      ? `${selectedEvent.venue_name}, ${selectedEvent.venue_city}, ${selectedEvent.venue_state}`
                      : "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Performer
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent?.primary_performer_name || "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent?.category_name || "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tickets
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent?.ticket_count ?? "-"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Listings
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent?.listing_count ?? "-"}
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
            loading={loading.listingTrends}
            timeRange={listingShortChart.timeRange}
            interval={listingShortChart.interval}
            onTimeRangeChange={listingShortChart.setTimeRange}
            onIntervalChange={listingShortChart.setInterval}
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
            loading={loading.listingTrends}
            timeRange={listingLongChart.timeRange}
            interval={listingLongChart.interval}
            onTimeRangeChange={listingLongChart.setTimeRange}
            onIntervalChange={listingLongChart.setInterval}
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
            loading={loading.sales}
            timeRange={salesChart.timeRange}
            interval={salesChart.interval}
            onTimeRangeChange={salesChart.setTimeRange}
            onIntervalChange={salesChart.setInterval}
            timeRangeOptions={TIME_RANGE_OPTIONS}
            intervalOptionsMap={INTERVAL_OPTIONS_MAP}
            height={400}
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
            headerComponent={
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Sales Data
              </Typography>
            }
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
            headerComponent={
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Suggestions
              </Typography>
            }
          />
        </Grid>
      </Grid>

      {/* Edit Suggestion Dialog */}
      <SuggestionDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        suggestion={editingSuggest}
        comment={editComment}
        onCommentChange={setEditComment}
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
