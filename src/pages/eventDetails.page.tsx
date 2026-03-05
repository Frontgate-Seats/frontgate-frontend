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
  COMBINED_SALES_CHART_CONFIG,
  LISTING_TRENDS_SHORT_CHART_CONFIG,
  LISTING_TRENDS_LONG_CHART_CONFIG,
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
  useCombinedSalesChartData,
  useListingTrendsChartData,
  useAvailabilityData,
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
    vividSales,
    listingTrends,
    loading,
    error,
    refetch,
  } = useEventData(eventId);
console.log("sales : ", sales)
  // Chart states
  const salesChart = useChartState("1d");
  const listingShortChart = useChartState("1d");
  const listingLongChart = useChartState("7d");
  const pricePointsChart = useChartState("6h"); // Single chart state for all availability data

  // Availability state from Redux
  const availabilityFromRedux = useSelector(
    (state: RootState) => state.availability,
  );

  // Chart datasets
  const combinedSalesData = useCombinedSalesChartData(
    sales || [],
    vividSales || [],
    salesChart.timeRange,
    salesChart.interval,
  );

  // Merge SeatGeek and Vivid data for combined chart
  const combinedSalesChartDataset = React.useMemo(() => {
    if (!combinedSalesData.seatgeek.length && !combinedSalesData.vivid.length) {
      return [];
    }

    // Create a map of all time buckets
    const timeMap = new Map<string, any>();

    combinedSalesData.seatgeek.forEach((item) => {
      timeMap.set(item.bucketStartUTC, {
        time: item.time,
        bucketStartUTC: item.bucketStartUTC,
        seatgeekAvgPrice: item.avgSalePrice,
        seatgeekListings: item.totalListings,
        seatgeekTickets: item.totalTickets,
        vividAvgPrice: 0,
        vividListings: 0,
        vividTickets: 0,
      });
    });

    combinedSalesData.vivid.forEach((item) => {
      const existing = timeMap.get(item.bucketStartUTC);
      if (existing) {
        existing.vividAvgPrice = item.avgSalePrice;
        existing.vividListings = item.totalListings;
        existing.vividTickets = item.totalTickets;
      } else {
        timeMap.set(item.bucketStartUTC, {
          time: item.time,
          bucketStartUTC: item.bucketStartUTC,
          seatgeekAvgPrice: 0,
          seatgeekListings: 0,
          seatgeekTickets: 0,
          vividAvgPrice: item.avgSalePrice,
          vividListings: item.totalListings,
          vividTickets: item.totalTickets,
        });
      }
    });

    return Array.from(timeMap.values()).sort((a, b) =>
      moment.utc(a.bucketStartUTC).valueOf() - moment.utc(b.bucketStartUTC).valueOf()
    );
  }, [combinedSalesData]);

  // Enhanced chart config showing both price and quantity
  const enhancedSalesChartConfig = React.useMemo(() => ({
    ...COMBINED_SALES_CHART_CONFIG,
    barSeries: [
      {
        type: "bar" as const,
        label: "SeatGeek Tickets",
        dataKey: "seatgeekTickets",
        color: "rgba(25,118,210,0.45)",
        yAxisId: "rightAxis",
      },
      {
        type: "bar" as const,
        label: "Vivid Tickets",
        dataKey: "vividTickets",
        color: "rgba(255,112,67,0.45)",
        yAxisId: "rightAxis",
      },
    ],
    rightAxisLabel: "Tickets Sold",
  }), []);

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

  // Combined availability data (single processing)
  const availabilityData = useAvailabilityData(
    availabilityFromRedux.data,
    pricePointsChart.timeRange,
    pricePointsChart.interval,
  );

  // Generate dynamic chart configs for sections and price points
  const sectionChartConfig = React.useMemo(
    () => ({
      ...AVAILABILITY_SECTION_CHART_CONFIG,
      lineSeries: generateSectionLineSeriesConfig(
        availabilityData.sectionChart,
      ),
    }),
    [availabilityData.sectionChart],
  );

  const priceChartConfig = React.useMemo(
    () => ({
      ...AVAILABILITY_PRICE_CHART_CONFIG,
      lineSeries: generatePricePointLineSeriesConfig(
        availabilityData.priceChart,
      ),
    }),
    [availabilityData.priceChart],
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

    const lastHoursCount = hoursMap[pricePointsChart.timeRange] || 24;
    dispatch(getAvailability({ eventId, lastHoursCount }));
  }, [dispatch, eventId, pricePointsChart.timeRange]);

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
      field: "source",
      headerName: "Source",
      minWidth: 100,
      flex: 1,
      type: "singleSelect",
      valueOptions: ["none", "SeatGeek", "Vivid"],
    },
    {
      field: "purchased_at",
      headerName: "Sold Date",
      minWidth: 120,
      flex: 1,
      type: "dateTime",
      valueFormatter: (value) => (value ? moment(value).format("MM/DD/YY") : "-"),
    },
    {
      field: "section_name",
      headerName: "Section",
      flex: 1,
      minWidth: 120,
      type: "string",
    },
    {
      field: "row_name",
      headerName: "Row",
      flex: 1,
      minWidth: 60,
      type: "string",
    },
 
    {
      field: "base_price",
      headerName: "Sold Price",
      minWidth: 100,
      min: 0,
      flex: 1,
      max: 20000,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" && value >= 0 ? `$${value.toFixed(0)}` : "-",
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

  // Capacity Table Columns
  const capacityColumns: CustomGridColDef[] = [
    {
      field: "time",
      headerName: "Date & Time",
      minWidth: 180,
      flex: 1,
      type: "dateTime",
      valueGetter: (value) => (value ? new Date(value) : null),
      valueFormatter: (value) => (value ? formatDateTime(value) : "-"),
    },
    {
      field: "totalCapacity",
      headerName: "Total",
      minWidth: 150,
      flex: 1,
      min: 0,
      max: 20000,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" ? value.toLocaleString() : "-",
    },
    {
      field: "available",
      headerName: "Available",
      minWidth: 150,
      flex: 1,
      min: 0,
      max: 20000,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" ? value.toLocaleString() : "-",
    },
  ];

  // Combine SeatGeek and Vivid sales data for the table
  const combinedSalesTableData = React.useMemo(() => {
    const seatgeekData = (sales || []).map((sale: any) => {
      const totalPrice = sale.base_price * sale.quantity;
      return {
        id: `sg-${sale.id}`,
        purchased_at: sale.purchased_at,
        section_name: sale.section_name || "-",
        row_name: sale.row_name || "-",
        base_price: sale.base_price,
        quantity: sale.quantity,
        total_price: totalPrice,
        source: "SeatGeek",
      };
    });

    const vividData = (vividSales || []).map((sale: any, index: number) => {
      // Parse section name to extract row if it's a number at the end
      let sectionName = sale.sectionName || "-";
      let rowName = "-";
      
      if (sectionName !== "-") {
        const parts = sectionName.split(" ");
        const lastPart = parts[parts.length - 1];
        
        // Only extract row if there are multiple parts AND last part is a number
        if (parts.length > 1 && !isNaN(Number(lastPart)) && lastPart.trim() !== "") {
          rowName = lastPart;
          sectionName = parts.slice(0, -1).join(" ");
        }
      }

      const basePrice = sale.totalTickets > 0 ? sale.totalSalePrice / sale.totalTickets : 0;
      
      return {
        id: `vivid-${index}`,
        purchased_at: sale.saleDate,
        section_name: sectionName,
        row_name: rowName,
        base_price: basePrice,
        quantity: sale.totalTickets,
        total_price: sale.totalSalePrice,
        source: "Vivid",
      };
    });

    return [...seatgeekData, ...vividData].sort((a, b) => 
      moment.utc(b.purchased_at).valueOf() - moment.utc(a.purchased_at).valueOf()
    );
  }, [sales, vividSales]);

  // Calculate sales summary statistics
  const salesSummary = React.useMemo(() => {
    const totalSales = combinedSalesTableData.length;
    const totalQuantity = combinedSalesTableData.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
    
    return {
      totalSales,
      totalQuantity,
    };
  }, [combinedSalesTableData]);

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
    filteredRows: filteredSales,
  } = useClientFilters({
    data: combinedSalesTableData || [],
    columns: salesColumns,
    initialPaginationModel: { page: 0, pageSize: 25 },
    initialSortModel: [{ field: "purchased_at", sort: "desc" }],
  });

  // Determine which sources are present in filtered sales data
  const activeSourcesInFilter = React.useMemo(() => {
    const sources = new Set(filteredSales.map((sale: any) => sale.source));
    return {
      hasSeatGeek: sources.has("SeatGeek"),
      hasVivid: sources.has("Vivid"),
    };
  }, [filteredSales]);

  // Filter chart data based on active sources
  const filteredCombinedSalesData = React.useMemo(() => {
    return combinedSalesChartDataset.map((item) => ({
      ...item,
      seatgeekAvgPrice: activeSourcesInFilter.hasSeatGeek ? item.seatgeekAvgPrice : 0,
      seatgeekListings: activeSourcesInFilter.hasSeatGeek ? item.seatgeekListings : 0,
      seatgeekTickets: activeSourcesInFilter.hasSeatGeek ? item.seatgeekTickets : 0,
      vividAvgPrice: activeSourcesInFilter.hasVivid ? item.vividAvgPrice : 0,
      vividListings: activeSourcesInFilter.hasVivid ? item.vividListings : 0,
      vividTickets: activeSourcesInFilter.hasVivid ? item.vividTickets : 0,
    }));
  }, [combinedSalesChartDataset, activeSourcesInFilter]);

  // Capacity Table Grid State
  const {
    paginationModel: capacityPaginationModel,
    sortModel: capacitySortModel,
    filterModel: capacityFilterModel,
    setPaginationModel: setCapacityPaginationModel,
    setSortModel: setCapacitySortModel,
    setFilterModel: setCapacityFilterModel,
    paginatedRows: paginatedCapacity,
    totalFilteredRows: capacityTotalFiltered,
  } = useClientFilters({
    data: availabilityData.capacityTable || [],
    columns: capacityColumns,
    initialPaginationModel: { page: 0, pageSize: 25 },
    initialSortModel: [{ field: "time", sort: "desc" }],
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
    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
      <Stack direction="row" alignItems="center" spacing={1}>
        <Tooltip title={
          activeSourcesInFilter.hasSeatGeek && activeSourcesInFilter.hasVivid
            ? "SeatGeek & Vivid Seats"
            : activeSourcesInFilter.hasSeatGeek
            ? "SeatGeek"
            : "Vivid Seats"
        }>
          <Stack direction="row" spacing={0.5}>
            {activeSourcesInFilter.hasSeatGeek && (
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
            )}
            {activeSourcesInFilter.hasVivid && (
              <Box
                component="img"
                src={VIVID_LOGO}
                alt="Vivid Seats Logo"
                sx={{
                  width: 24,
                  height: 24,
                  objectFit: "contain",
                }}
              />
            )}
          </Stack>
        </Tooltip>
        <Typography variant="h6" fontWeight={600}>
          Sales Data
        </Typography>
      </Stack>
      <Stack direction="row" spacing={3} alignItems="center">
        <Box>
          <Typography variant="body2" color="text.secondary">
            Total Sales:
          </Typography>
          <Typography variant="h6" fontWeight={600}>
            {salesSummary.totalSales}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Total sold QTY:
          </Typography>
          <Typography variant="h6" fontWeight={600}>
            {salesSummary.totalQuantity}
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );

  const capacityHeaderComponent = (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Tooltip title="Ticketmaster">
        <Box
          component="img"
          src={TJ_LOGO}
          alt="Ticketmaster Logo"
          sx={{
            width: 24,
            height: 24,
            objectFit: "contain",
          }}
        />
      </Tooltip>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Primary Market Availability - Capacity Trends
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
                {matchedSeatGeekEvent ? (
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
                  </Stack>
                ) : (
                  <></>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Primary Market Availability - Price Point Distribution */}
        <Grid size={{ xs: 12 }}>
          <DynamicChart
            title="Price Points - Availability Trends"
            dataset={availabilityData.priceChart}
            chartConfig={priceChartConfig}
            loading={availabilityFromRedux.loading}
            timeRange={pricePointsChart.timeRange}
            interval={pricePointsChart.interval}
            onTimeRangeChange={pricePointsChart.setTimeRange}
            onIntervalChange={pricePointsChart.setInterval}
            timeRangeOptions={TIME_RANGE_OPTIONS}
            intervalOptionsMap={INTERVAL_OPTIONS_MAP}
            height={400}
            logo={TJ_LOGO}
          />
        </Grid>

        {/* Primary Market Availability - Capacity Table */}
        <Grid size={{ xs: 12, md: 6 }}>
          <CustomDataGrid
            title="Primary Market Availability - Capacity Trends"
            rows={paginatedCapacity}
            rowCount={capacityTotalFiltered}
            columns={capacityColumns}
            isLoading={availabilityFromRedux.loading}
            error={null}
            paginationModel={capacityPaginationModel}
            setPaginationModel={setCapacityPaginationModel}
            sortingModel={capacitySortModel}
            setSortingModel={setCapacitySortModel}
            filterModel={capacityFilterModel}
            setFilterModel={setCapacityFilterModel}
            defaultFilterType="header"
            onRefresh={() => {
              if (eventId) {
                const hoursMap: Record<string, number> = {
                  "6h": 6,
                  "12h": 12,
                  "24h": 24,
                  "48h": 48,
                  "7d": 168,
                };
                const lastHoursCount =
                  hoursMap[pricePointsChart.timeRange] || 24;
                dispatch(getAvailability({ eventId, lastHoursCount }));
              }
            }}
            height={400}
            headerComponent={capacityHeaderComponent}
            logo={TJ_LOGO}
          />
        </Grid>

        {/* Primary Market Availability - Section Breakdown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DynamicChart
            title="Sections - Availability Trends"
            dataset={availabilityData.sectionChart}
            chartConfig={sectionChartConfig}
            loading={availabilityFromRedux.loading}
            timeRange={pricePointsChart.timeRange}
            interval={pricePointsChart.interval}
            onTimeRangeChange={pricePointsChart.setTimeRange}
            onIntervalChange={pricePointsChart.setInterval}
            timeRangeOptions={TIME_RANGE_OPTIONS}
            intervalOptionsMap={INTERVAL_OPTIONS_MAP}
            height={400}
            logo={TJ_LOGO}
          />
        </Grid>

        {/* Listing Trends - Short Term */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DynamicChart
            title="Listing Trends"
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
            title="Listing Trends"
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
            dataset={filteredCombinedSalesData}
            chartConfig={enhancedSalesChartConfig}
            loading={loading.sales || loading.vividSales}
            timeRange={salesChart.timeRange}
            interval={salesChart.interval}
            onTimeRangeChange={salesChart.setTimeRange}
            onIntervalChange={salesChart.setInterval}
            timeRangeOptions={TIME_RANGE_OPTIONS}
            intervalOptionsMap={INTERVAL_OPTIONS_MAP}
            height={400}
            logo={
              activeSourcesInFilter.hasSeatGeek && activeSourcesInFilter.hasVivid
                ? undefined // Show both logos in a custom way
                : activeSourcesInFilter.hasSeatGeek
                ? SEATGEEK_LOGO
                : VIVID_LOGO
            }
            customLogoComponent={
              activeSourcesInFilter.hasSeatGeek && activeSourcesInFilter.hasVivid ? (
                <Stack direction="row" spacing={0.5}>
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
                  <Box
                    component="img"
                    src={VIVID_LOGO}
                    alt="Vivid Seats Logo"
                    sx={{
                      width: 24,
                      height: 24,
                      objectFit: "contain",
                    }}
                  />
                </Stack>
              ) : undefined
            }
          />
        </Grid>

        {/* Sales Data Grid */}
        <Grid size={{ xs: 12, md: 6 }}>
          <CustomDataGrid
            title="Sales Data"
            rows={paginatedSales}
            rowCount={salesTotalFiltered}
            columns={salesColumns}
            isLoading={loading.sales || loading.vividSales}
            error={error.sales || error.vividSales}
            paginationModel={salesPaginationModel}
            setPaginationModel={setSalesPaginationModel}
            sortingModel={salesSortModel}
            setSortingModel={setSalesSortModel}
            filterModel={salesFilterModel}
            setFilterModel={setSalesFilterModel}
            defaultFilterType="header"
            onRefresh={() => {
              refetch.sales();
              refetch.vividSales();
            }}
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
