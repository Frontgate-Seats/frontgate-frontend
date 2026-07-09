import * as React from "react";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Tooltip,
  Link,
  Button,
  Chip,
  Box,
  Divider,
  Skeleton,
} from "@mui/material";
import { PlayArrow, Stop } from "@mui/icons-material";
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
import { getEventAnalysisLogs } from "../store/slices/eventAnalysisLogs.slice";
import {
  startEventMonitoring,
  stopEventMonitoring,
} from "../store/slices/events.slice";
import { getAvailability, clearAvailability } from "../store/slices/availability.slice";
import { useClientFilters } from "../hooks/useClientFilters";
import { useChartState, type UseChartStateReturn } from "../hooks/useChartState";
import { useEventData } from "../hooks/useEventData";
import {
  INTERVAL_OPTIONS_MAP,
  COMBINED_SALES_CHART_CONFIG,
  LISTING_TRENDS_SHORT_CHART_CONFIG,
  LISTING_TRENDS_LONG_CHART_CONFIG,
  AVAILABILITY_SECTION_CHART_CONFIG,
  AVAILABILITY_PRICE_CHART_CONFIG,
  TIME_RANGE_OPTIONS,
  getDefaultInterval,
} from "../shared/constants/components.constants";
import {
  generateSectionLineSeriesConfig,
  generatePricePointLineSeriesConfig,
} from "../shared/utils/chartConfig.util";
import DynamicChart from "../components/common/charts/DynamicChart";
import {
  useListingTrendsChartData,
  useAvailabilityData,
  useCombinedSalesChartDataFromRows,
} from "../hooks/useChartData";
import {
  ConfirmDialog,
  StartMonitoringDialog,
  type MonitorLevel,
} from "../components/common/dialogs";

// ─── Compact labelled field — mirrors EventMappingCard's Field component ─────
function EventField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.disabled"
        display="block"
        sx={{ fontSize: "0.65rem", lineHeight: 1.2, mb: 0.1, whiteSpace: "nowrap" }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontSize: "0.78rem", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {children ?? <Box component="span" sx={{ color: "text.disabled" }}>—</Box>}
      </Typography>
    </Box>
  );
}

export default function EventDetailsPage() {
  const dispatch = useAppDispatch();
  const { eventId } = useParams<{ eventId: string }>();

  // Logo paths
  const TJ_LOGO = "/tj-logo.ico";
  const VIVID_LOGO = "/vivid-logo.ico";
  const SEATGEEK_LOGO = "/seatgeek-logo.ico";
  const STUBHUB_LOGO = "/stubhub-logo.ico";

  // Primary market provider label and logo (dynamic based on pmEvent.marketType)
  const pmMarketType = availabilityFromRedux.data?.pmEvent?.marketType || "";
  const PRIMARY_LABEL = pmMarketType ? `Primary (${pmMarketType})` : "Primary";
  const PRIMARY_LOGO = TJ_LOGO; // Use TJ logo as the primary market aggregator logo

  // Fetch event-related data (excluding suggests - handled separately for server-side rendering)
  const {
    selectedEvent,
    matchedSeatGeekEvent,
    matchedStubhubEvent,
    sales,
    vividSales,
    stubhubSales,
    listingTrends,
    loading,
    error,
    refetch,
  } = useEventData(eventId);
  // Each chart has its own default, but once the user changes any one of them
  // all charts sync to that selection via the shared override state.
  const salesChartBase        = useChartState("all");
  const listingShortChartBase = useChartState("1d");
  const listingLongChartBase  = useChartState("7d");
  const pricePointsChartBase  = useChartState("7d");

  // Shared override: null = each chart uses its own default independently.
  // Once the user changes any chart, all charts sync to this value.
  const [override, setOverride] = React.useState<{ timeRange: string; interval: string } | null>(null);

  // For rendering we need reactive values (not getters), so derive them from state directly
  const activeTimeRange = override?.timeRange ?? salesChartBase.timeRange;

  const salesChart: UseChartStateReturn = {
    timeRange:    override?.timeRange ?? salesChartBase.timeRange,
    interval:     override?.interval  ?? salesChartBase.interval,
    setTimeRange: (v: string) => { salesChartBase.setTimeRange(v); setOverride({ timeRange: v, interval: getDefaultInterval(v) }); },
    setInterval:  (v: string) => { salesChartBase.setInterval(v);  setOverride((p) => ({ timeRange: p?.timeRange ?? salesChartBase.timeRange, interval: v })); },
    _setDataSpanMs: salesChartBase._setDataSpanMs,
  };
  const listingShortChart: UseChartStateReturn = {
    timeRange:    override?.timeRange ?? listingShortChartBase.timeRange,
    interval:     override?.interval  ?? listingShortChartBase.interval,
    setTimeRange: (v: string) => { listingShortChartBase.setTimeRange(v); setOverride({ timeRange: v, interval: getDefaultInterval(v) }); },
    setInterval:  (v: string) => { listingShortChartBase.setInterval(v);  setOverride((p) => ({ timeRange: p?.timeRange ?? listingShortChartBase.timeRange, interval: v })); },
    _setDataSpanMs: listingShortChartBase._setDataSpanMs,
  };
  const listingLongChart: UseChartStateReturn = {
    timeRange:    override?.timeRange ?? listingLongChartBase.timeRange,
    interval:     override?.interval  ?? listingLongChartBase.interval,
    setTimeRange: (v: string) => { listingLongChartBase.setTimeRange(v); setOverride({ timeRange: v, interval: getDefaultInterval(v) }); },
    setInterval:  (v: string) => { listingLongChartBase.setInterval(v);  setOverride((p) => ({ timeRange: p?.timeRange ?? listingLongChartBase.timeRange, interval: v })); },
    _setDataSpanMs: listingLongChartBase._setDataSpanMs,
  };
  const pricePointsChart: UseChartStateReturn = {
    timeRange:    override?.timeRange ?? pricePointsChartBase.timeRange,
    interval:     override?.interval  ?? pricePointsChartBase.interval,
    setTimeRange: (v: string) => { pricePointsChartBase.setTimeRange(v); setOverride({ timeRange: v, interval: getDefaultInterval(v) }); },
    setInterval:  (v: string) => { pricePointsChartBase.setInterval(v);  setOverride((p) => ({ timeRange: p?.timeRange ?? pricePointsChartBase.timeRange, interval: v })); },
    _setDataSpanMs: pricePointsChartBase._setDataSpanMs,
  };

  // Availability state from Redux — must be declared before the span useEffect below
  const availabilityFromRedux = useSelector(
    (state: RootState) => state.availability,
  );

  // When "all" is selected, compute the actual data span from whichever source
  // has the widest range and push it into the chart state so the interval
  // auto-selects the coarsest option that still looks good.
  React.useEffect(() => {
    if (activeTimeRange !== "all") return;

    const timestamps: number[] = [];

    // Sales data
    (sales || []).forEach((s: any) => {
      const t = s.purchased_at ? moment.utc(s.purchased_at).valueOf() : NaN;
      if (!isNaN(t)) timestamps.push(t);
    });
    (vividSales || []).forEach((s: any) => {
      const t = s.saleDate ? moment.utc(s.saleDate).valueOf() : NaN;
      if (!isNaN(t)) timestamps.push(t);
    });

    // Listing trends
    (listingTrends || []).forEach((l: any) => {
      const t = l.created_at ? moment.utc(l.created_at).valueOf() : NaN;
      if (!isNaN(t)) timestamps.push(t);
    });

    // Availability snapshots
    (availabilityFromRedux.data?.snapshots || []).forEach((s: any) => {
      const t = s.timestamp ? moment.utc(s.timestamp).valueOf() : NaN;
      if (!isNaN(t)) timestamps.push(t);
    });

    if (timestamps.length === 0) return;

    const spanMs = moment.utc().valueOf() - Math.min(...timestamps);
    const smartSpan = spanMs > 0 ? spanMs : null;
    // Push to all base chart states so each one has the span
    salesChartBase._setDataSpanMs(smartSpan);
    listingShortChartBase._setDataSpanMs(smartSpan);
    listingLongChartBase._setDataSpanMs(smartSpan);
    pricePointsChartBase._setDataSpanMs(smartSpan);
  }, [
    activeTimeRange,
    sales,
    vividSales,
    listingTrends,
    availabilityFromRedux.data,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enhanced chart config showing price, total revenue, and ticket quantity
  const enhancedSalesChartConfig = React.useMemo(() => ({
    ...COMBINED_SALES_CHART_CONFIG,
    lineSeries: [
      ...(COMBINED_SALES_CHART_CONFIG.lineSeries || []),
      {
        type: "line" as const,
        label: "SeatGeek Total Revenue",
        dataKey: "seatgeekTotalPrice",
        color: "#2e7d32",
        yAxisId: "leftAxis",
        valueFormatter: (v: any) => (v != null ? `$${v}` : "-"),
      },
      {
        type: "line" as const,
        label: "Vivid Total Revenue",
        dataKey: "vividTotalPrice",
        color: "#7b1fa2",
        yAxisId: "leftAxis",
        valueFormatter: (v: any) => (v != null ? `$${v}` : "-"),
      },
      {
        type: "line" as const,
        label: "StubHub Total Revenue",
        dataKey: "stubhubTotalPrice",
        color: "#00695c",
        yAxisId: "leftAxis",
        valueFormatter: (v: any) => (v != null ? `$${v}` : "-"),
      },
    ],
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
      {
        type: "bar" as const,
        label: "StubHub Tickets",
        dataKey: "stubhubTickets",
        color: "rgba(0,105,92,0.45)",
        yAxisId: "rightAxis",
      },
    ],
    leftAxisLabel: "Price / Revenue ($)",
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
      ).series,
    }),
    [availabilityData.sectionChart],
  );

  const priceChartConfig = React.useMemo(
    () => ({
      ...AVAILABILITY_PRICE_CHART_CONFIG,
      lineSeries: generatePricePointLineSeriesConfig(
        availabilityData.priceChart,
      ).series,
    }),
    [availabilityData.priceChart],
  );

  // Stable empty set — used as fallback when dataset has no series keys
  const EMPTY_SET = React.useMemo(() => new Set<string>(), []);

  // Compute initial hidden series for price chart: show only top 10% by total availability
  const priceChartInitialHidden = React.useMemo(() => {
    const dataset = availabilityData.priceChart;
    if (!dataset || dataset.length === 0) return EMPTY_SET;

    const firstPoint = dataset[0];
    const keys = Object.keys(firstPoint).filter(
      (k) => k !== "time" && k !== "bucketStartUTC",
    );
    if (keys.length === 0) return EMPTY_SET;

    // Sum availability across all time buckets per key
    const totals: Record<string, number> = {};
    keys.forEach((k) => {
      totals[k] = dataset.reduce((sum: number, pt: any) => sum + (pt[k] ?? 0), 0);
    });

    const sorted = [...keys].sort((a, b) => totals[b] - totals[a]);
    const topCount = Math.max(1, Math.ceil(sorted.length * 0.05));
    const topKeys = new Set(sorted.slice(0, topCount));

    return new Set(keys.filter((k) => !topKeys.has(k)));
  }, [availabilityData.priceChart]);

  // Compute initial hidden series for section chart: show only top 10% by total availability
  const sectionChartInitialHidden = React.useMemo(() => {
    const dataset = availabilityData.sectionChart;
    if (!dataset || dataset.length === 0) return EMPTY_SET;

    const firstPoint = dataset[0];
    const keys = Object.keys(firstPoint).filter(
      (k) => k !== "time" && k !== "bucketStartUTC",
    );
    if (keys.length === 0) return EMPTY_SET;

    // Sum availability across all time buckets per key
    const totals: Record<string, number> = {};
    keys.forEach((k) => {
      totals[k] = dataset.reduce((sum: number, pt: any) => sum + (pt[k] ?? 0), 0);
    });

    const sorted = [...keys].sort((a, b) => totals[b] - totals[a]);
    const topCount = Math.max(1, Math.ceil(sorted.length * 0.2));
    const topKeys = new Set(sorted.slice(0, topCount));

    return new Set(keys.filter((k) => !topKeys.has(k)));
  }, [availabilityData.sectionChart]);

  const analysisLogsFromRedux = useSelector((state: RootState) => state.eventAnalysisLogs);
  const [analysisLogsPaginationModel, setAnalysisLogsPaginationModel] =
    React.useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [analysisLogsSortModel, setAnalysisLogsSortModel] =
    React.useState<GridSortModel>([{ field: "created_at", sort: "desc" }]);
  const [analysisLogsFilterModel, setAnalysisLogsFilterModel] =
    React.useState<GridFilterModel>({ items: [] });

  // Monitor Dialog State
  const [confirmStopDialog, setConfirmStopDialog] = React.useState(false);
  const [startMonitorDialog, setStartMonitorDialog] = React.useState(false);

  const isMonitoring = selectedEvent?.is_monitored || false;
  const monitorLevel = selectedEvent?.monitor_level || "none";

  // Edit Dialog Handlers — removed (event_analysis_logs is read-only)

  // Fetch analysis logs with server-side pagination/sorting/filtering
  React.useEffect(() => {
    if (!eventId) return;

    dispatch(
      getEventAnalysisLogs({
        page: analysisLogsPaginationModel.page,
        pageSize: analysisLogsPaginationModel.pageSize,
        sortFields: analysisLogsSortModel,
        filters: {
          items: [
            { field: "event_id", operator: "equals", value: eventId },
            ...analysisLogsFilterModel.items,
          ],
        },
      }),
    );
  }, [
    dispatch,
    eventId,
    analysisLogsPaginationModel.page,
    analysisLogsPaginationModel.pageSize,
    analysisLogsSortModel,
    analysisLogsFilterModel,
  ]);

  // Fetch availability data — clear stale data first so old time range doesn't linger
  React.useEffect(() => {
    if (!eventId) return;

    const hoursMap: Record<string, number> = {
      "all":  87600, // 10 years — fetch everything
      "1h":   1,
      "3h":   3,
      "6h":   6,
      "12h":  12,
      "1d":   24,
      "7d":   168,
      "30d":  720,
      "3m":   2160,
      "6m":   4380,
      "1y":   8760,
    };

    const lastHoursCount = hoursMap[activeTimeRange] ?? 24;
    dispatch(clearAvailability());
    dispatch(getAvailability({ eventId, lastHoursCount }));
  }, [dispatch, eventId, activeTimeRange]);

  const handleRefreshAnalysisLogs = React.useCallback(() => {
    if (!eventId) return;
    dispatch(
      getEventAnalysisLogs({
        page: analysisLogsPaginationModel.page,
        pageSize: analysisLogsPaginationModel.pageSize,
        sortFields: analysisLogsSortModel,
        filters: {
          items: [
            { field: "event_id", operator: "equals", value: eventId },
            ...analysisLogsFilterModel.items,
          ],
        },
      }),
    );
  }, [
    dispatch,
    eventId,
    analysisLogsPaginationModel.page,
    analysisLogsPaginationModel.pageSize,
    analysisLogsSortModel,
    analysisLogsFilterModel,
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
      minWidth: 70,
      maxWidth: 70,
      flex: 0,
      type: "singleSelect",
      valueOptions: ["none", "SeatGeek", "Vivid", "StubHub"],
      renderCell: (params: any) => {
        const logoMap: Record<string, string> = {
          SeatGeek: SEATGEEK_LOGO,
          Vivid: VIVID_LOGO,
          StubHub: STUBHUB_LOGO,
        };
        const logo = logoMap[params.value];
        if (!logo) return params.value || "-";
        return (
          <Tooltip title={params.value}>
            <Box
              component="img"
              src={logo}
              alt={params.value}
              sx={{ width: 20, height: 20, objectFit: "contain" }}
            />
          </Tooltip>
        );
      },
    },
    {
      field: "purchased_at",
      headerName: "Sold Date",
      minWidth: 160,
      flex: 1,
      type: "dateTime",
      valueGetter: (value: any) => (value ? new Date(value) : null),
      valueFormatter: (value: any) => (value ? formatDateTime(value) : "-"),
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
      headerName: "Avg. Price",
      minWidth: 100,
      min: 0,
      flex: 1,
      max: 20000,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" && value >= 0 ? `$${value}` : "-",
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
    {
      field: "total_price",
      headerName: "Total Price",
      minWidth: 110,
      flex: 1,
      min: 0,
      max: 500000,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" && value >= 0 ? `$${value}` : "-",
    },
  ];

  // Capacity Table Columns
  const capacityColumns: CustomGridColDef[] = [
    {
      field: "bucketStartUTC",
      headerName: "Date & Time",
      minWidth: 180,
      flex: 1,
      type: "dateTime",
      valueGetter: (value: any) => (value ? new Date(value) : null),
      valueFormatter: (value: any) => (value ? formatDateTime(value) : "-"),
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

    const stubhubData = (stubhubSales || []).map((sale: any, index: number) => ({
      id: sale.id || `sh-${index}`,
      purchased_at: sale.purchased_at,
      section_name: sale.section_name || "-",
      row_name: sale.row_name || "-",
      base_price: sale.base_price,
      quantity: sale.quantity,
      total_price: sale.total_price || sale.base_price * sale.quantity,
      source: "StubHub",
    }));

    return [...seatgeekData, ...vividData, ...stubhubData].sort((a, b) => 
      moment.utc(b.purchased_at).valueOf() - moment.utc(a.purchased_at).valueOf()
    );
  }, [sales, vividSales, stubhubSales]);

  // Derive a cutoff date from the active time range — null means "all time" (no filter)
  const timeRangeCutoffDate = React.useMemo(() => {
    if (activeTimeRange === "all") return null;
    const now = moment.utc();
    switch (activeTimeRange) {
      case "1h":  return now.subtract(1, "hour").toDate();
      case "3h":  return now.subtract(3, "hours").toDate();
      case "6h":  return now.subtract(6, "hours").toDate();
      case "12h": return now.subtract(12, "hours").toDate();
      case "1d":  return now.subtract(1, "day").toDate();
      case "7d":  return now.subtract(7, "days").toDate();
      case "30d": return now.subtract(30, "days").toDate();
      case "3m":  return now.subtract(3, "months").toDate();
      case "6m":  return now.subtract(6, "months").toDate();
      case "1y":  return now.subtract(1, "year").toDate();
      default:    return null;
    }
  }, [activeTimeRange]);

  // Sales Grid State — no default date filter, show all sales from all time
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
    initialFilterModel: { items: [] },
  });

  // Sync sales table date filter when global time range changes
  React.useEffect(() => {
    setSalesFilterModel((prev) => {
      const otherItems = prev.items.filter((item) => item.field !== "purchased_at");
      if (!timeRangeCutoffDate) {
        return { ...prev, items: otherItems };
      }
      return {
        ...prev,
        items: [
          ...otherItems,
          { field: "purchased_at", operator: "onOrAfter", value: timeRangeCutoffDate.toISOString() },
        ],
      };
    });
  }, [timeRangeCutoffDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync analysis logs date filter when global time range changes
  React.useEffect(() => {
    setAnalysisLogsFilterModel((prev) => {
      const otherItems = prev.items.filter((item) => item.field !== "created_at");
      if (!timeRangeCutoffDate) {
        return { ...prev, items: otherItems };
      }
      return {
        ...prev,
        items: [
          ...otherItems,
          { field: "created_at", operator: "onOrAfter", value: timeRangeCutoffDate.toISOString() },
        ],
      };
    });
  }, [timeRangeCutoffDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate sales summary statistics — based on filtered rows so header stats match the table
  const salesSummary = React.useMemo(() => {
    const totalSales = filteredSales.length;
    const totalQuantity = filteredSales.reduce((sum: number, sale: any) => sum + (sale.quantity || 0), 0);
    return { totalSales, totalQuantity };
  }, [filteredSales]);
  // Determine which sources are present in filtered sales data
  const activeSourcesInFilter = React.useMemo(() => {
    const sources = new Set(filteredSales.map((sale: any) => sale.source));
    return {
      hasSeatGeek: sources.has("SeatGeek"),
      hasVivid: sources.has("Vivid"),
      hasStubHub: sources.has("StubHub"),
    };
  }, [filteredSales]);

  // Re-bucket filtered sales for the chart using the shared hook — reuses the same
  // time-range/interval logic from useChartData, no duplication.
  const filteredCombinedSalesChartDataset = useCombinedSalesChartDataFromRows(
    filteredSales,
    salesChart.timeRange,
    salesChart.interval,
  );

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
    initialSortModel: [{ field: "bucketStartUTC", sort: "desc" }],
  });

  // Analysis Logs Data Grid Columns
  const analysisLogsColumns: CustomGridColDef[] = [
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
      field: "llm_action",
      headerName: "Action",
      minWidth: 120,
      flex: 1,
      type: "string",
    },
    {
      field: "recommendation_count",
      headerName: "Recommendations",
      minWidth: 140,
      flex: 1,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" ? value.toString() : "-",
    },
    {
      field: "monitor_level",
      headerName: "Monitor Level",
      minWidth: 130,
      flex: 1,
      type: "string",
    },
    {
      field: "days_to_event",
      headerName: "Days to Event",
      minWidth: 130,
      flex: 1,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" ? value.toString() : "-",
    },
    {
      field: "event_assessment_action",
      headerName: "Assessment",
      minWidth: 150,
      flex: 1,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) =>
        row?.llm_result?.event_assessment?.recommended_action ?? "-",
    },
    {
      field: "demand_signal",
      headerName: "Demand Signal",
      minWidth: 140,
      flex: 1,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) =>
        row?.llm_result?.event_assessment?.demand_signal ?? "-",
    },
    {
      field: "reasoning",
      headerName: "Reasoning",
      minWidth: 300,
      flex: 2,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) =>
        row?.llm_result?.event_assessment?.reasoning ?? "-",
    },
  ];

  // Custom header components with logos
  const salesHeaderComponent = (
    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
      <Stack direction="row" alignItems="center" spacing={1}>
        <Tooltip title={
          [
            activeSourcesInFilter.hasSeatGeek && "SeatGeek",
            activeSourcesInFilter.hasVivid && "Vivid Seats",
            activeSourcesInFilter.hasStubHub && "StubHub",
          ].filter(Boolean).join(" & ") || "No Sources"
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
            {activeSourcesInFilter.hasStubHub && (
              <Box
                component="img"
                src={STUBHUB_LOGO}
                alt="StubHub Logo"
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
      <Tooltip title={PRIMARY_LABEL}>
        <Box
          component="img"
          src={PRIMARY_LOGO}
          alt="Primary Market Logo"
          sx={{
            width: 24,
            height: 24,
            objectFit: "contain",
          }}
        />
      </Tooltip>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {PRIMARY_LABEL} - Capacity Trends
      </Typography>
    </Stack>
  );

  const analysisLogsHeaderComponent = (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Buy Recommendations
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
            <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
              <Stack spacing={1.25} divider={<Divider />}>

                {/* Vivid Seats row */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Stack direction="row" alignItems="center" sx={{ flexShrink: 0, width: 32 }}>
                    <Tooltip title="Vivid Seats">
                      <Box component="img" src={VIVID_LOGO} alt="Vivid Seats"
                        sx={{ width: 18, height: 18, objectFit: "contain" }}
                        onError={(e: any) => { e.currentTarget.style.display = "none"; }}
                      />
                    </Tooltip>
                  </Stack>
                  <Divider orientation="vertical" flexItem />
                  {loading.events ? (
                    <Stack direction="row" spacing={3} sx={{ flex: 1 }}>
                      {[80, 140, 110, 120, 90, 80].map((w) => (
                        <Skeleton key={w} variant="text" width={w} height={32} />
                      ))}
                    </Stack>
                  ) : (
                    <Grid container spacing={1.5} columns={12} sx={{ flex: 1 }}>
                      <Grid size={1}>
                        <EventField label="Event ID">
                          {selectedEvent?.id ? (
                            selectedEvent.web_path ? (
                              <Link href={`https://www.vividseats.com${selectedEvent.web_path}`}
                                target="_blank" rel="noopener noreferrer" underline="hover" color="primary">
                                {selectedEvent.id}
                              </Link>
                            ) : selectedEvent.id
                          ) : null}
                        </EventField>
                      </Grid>
                      <Grid size={2}><EventField label="Name">{selectedEvent?.name}</EventField></Grid>
                      <Grid size={2}>
                        <EventField label="Date">
                          {selectedEvent?.local_date ? formatDateTime(moment.parseZone(selectedEvent.local_date)) : null}
                        </EventField>
                      </Grid>
                      <Grid size={3}>
                        <EventField label="Venue">
                          {selectedEvent?.venue_name
                            ? `${selectedEvent.venue_name}, ${selectedEvent.venue_city}, ${selectedEvent.venue_state}`
                            : null}
                        </EventField>
                      </Grid>
                      <Grid size={2}><EventField label="Performer">{selectedEvent?.primary_performer_name}</EventField></Grid>
                      <Grid size={2}><EventField label="Category">{selectedEvent?.category_name}</EventField></Grid>
                    </Grid>
                  )}
                </Stack>

                {/* SeatGeek row */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Stack direction="row" alignItems="center" sx={{ flexShrink: 0, width: 32 }}>
                    <Tooltip title="SeatGeek">
                      <Box component="img" src={SEATGEEK_LOGO} alt="SeatGeek"
                        sx={{ width: 18, height: 18, objectFit: "contain" }}
                        onError={(e: any) => { e.currentTarget.style.display = "none"; }}
                      />
                    </Tooltip>
                  </Stack>
                  <Divider orientation="vertical" flexItem />
                  {loading.events ? (
                    <Stack direction="row" spacing={3} sx={{ flex: 1 }}>
                      {[80, 140, 110, 120, 90, 80].map((w) => (
                        <Skeleton key={w} variant="text" width={w} height={32} />
                      ))}
                    </Stack>
                  ) : !matchedSeatGeekEvent ? (
                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                      No Data Available
                    </Typography>
                  ) : (
                    <Grid container spacing={1.5} columns={12} sx={{ flex: 1 }}>
                      <Grid size={1}>
                        <EventField label="Event ID">
                          {matchedSeatGeekEvent.id ? (
                            <Link href={matchedSeatGeekEvent.web_path?.startsWith("http")
                              ? matchedSeatGeekEvent.web_path
                              : `https://seatgeek.com${matchedSeatGeekEvent.web_path}`}
                              target="_blank" rel="noopener noreferrer" underline="hover" color="primary">
                              {matchedSeatGeekEvent.id}
                            </Link>
                          ) : null}
                        </EventField>
                      </Grid>
                      <Grid size={2}><EventField label="Name">{matchedSeatGeekEvent.name}</EventField></Grid>
                      <Grid size={2}>
                        <EventField label="Date">
                          {matchedSeatGeekEvent.local_date ? formatDateTime(moment.parseZone(matchedSeatGeekEvent.local_date)) : null}
                        </EventField>
                      </Grid>
                      <Grid size={3}>
                        <EventField label="Venue">
                          {matchedSeatGeekEvent.venue_name
                            ? `${matchedSeatGeekEvent.venue_name}, ${matchedSeatGeekEvent.venue_city}, ${matchedSeatGeekEvent.venue_state}`
                            : null}
                        </EventField>
                      </Grid>
                      <Grid size={2}><EventField label="Performer">{matchedSeatGeekEvent.primary_performer_name}</EventField></Grid>
                      <Grid size={2}><EventField label="Category">{matchedSeatGeekEvent.category_name}</EventField></Grid>
                    </Grid>
                  )}
                </Stack>

                {/* StubHub row */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Stack direction="row" alignItems="center" sx={{ flexShrink: 0, width: 32 }}>
                    <Tooltip title="StubHub">
                      <Box component="img" src={STUBHUB_LOGO} alt="StubHub"
                        sx={{ width: 18, height: 18, objectFit: "contain" }}
                        onError={(e: any) => { e.currentTarget.style.display = "none"; }}
                      />
                    </Tooltip>
                  </Stack>
                  <Divider orientation="vertical" flexItem />
                  {loading.stubhubEvents ? (
                    <Stack direction="row" spacing={3} sx={{ flex: 1 }}>
                      {[80, 140, 110, 120, 90, 80].map((w) => (
                        <Skeleton key={w} variant="text" width={w} height={32} />
                      ))}
                    </Stack>
                  ) : !matchedStubhubEvent ? (
                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                      No Data Available
                    </Typography>
                  ) : (
                    <Grid container spacing={1.5} columns={12} sx={{ flex: 1 }}>
                      <Grid size={1}>
                        <EventField label="Event ID">
                          {matchedStubhubEvent.id ? (
                            <Link href={matchedStubhubEvent.web_path?.startsWith("http")
                              ? matchedStubhubEvent.web_path
                              : `https://www.stubhub.com/event/${matchedStubhubEvent.id}`}
                              target="_blank" rel="noopener noreferrer" underline="hover" color="primary">
                              {matchedStubhubEvent.id}
                            </Link>
                          ) : null}
                        </EventField>
                      </Grid>
                      <Grid size={2}><EventField label="Name">{matchedStubhubEvent.name}</EventField></Grid>
                      <Grid size={2}>
                        <EventField label="Date (UTC)">
                          {matchedStubhubEvent.utc_date
                            ? formatDateTime(moment.utc(matchedStubhubEvent.utc_date))
                            : null}
                        </EventField>
                      </Grid>
                      <Grid size={3}>
                        <EventField label="Venue">
                          {matchedStubhubEvent.venue_name
                            ? `${matchedStubhubEvent.venue_name}${matchedStubhubEvent.venue_city ? `, ${matchedStubhubEvent.venue_city}` : ""}${matchedStubhubEvent.venue_state ? `, ${matchedStubhubEvent.venue_state}` : ""}`
                            : null}
                        </EventField>
                      </Grid>
                      <Grid size={2}><EventField label="Performer">{matchedStubhubEvent.primary_performer_name}</EventField></Grid>
                      <Grid size={2}><EventField label="Category">{matchedStubhubEvent.category_name}</EventField></Grid>
                    </Grid>
                  )}
                </Stack>

                {/* Primary Market row */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Stack direction="row" alignItems="center" sx={{ flexShrink: 0, width: 32 }}>
                    <Tooltip title={PRIMARY_LABEL}>
                      <Box component="img" src={PRIMARY_LOGO} alt="Primary Market"
                        sx={{ width: 18, height: 18, objectFit: "contain" }}
                        onError={(e: any) => { e.currentTarget.style.display = "none"; }}
                      />
                    </Tooltip>
                  </Stack>
                  <Divider orientation="vertical" flexItem />
                  {availabilityFromRedux.loading && !availabilityFromRedux.data?.pmEvent ? (
                    <Stack direction="row" spacing={3} sx={{ flex: 1 }}>
                      {[80, 140, 110, 120, 90, 80].map((w) => (
                        <Skeleton key={w} variant="text" width={w} height={32} />
                      ))}
                    </Stack>
                  ) : !availabilityFromRedux.data?.pmEvent ? (
                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                      No Data Available
                    </Typography>
                  ) : (
                    <Grid container spacing={1.5} columns={12} sx={{ flex: 1 }}>
                      <Grid size={1}>
                        <EventField label="Event ID">
                          {availabilityFromRedux.data.pmEvent.id ? (
                            <Link href={availabilityFromRedux.data.pmEvent.eventUrl
                              || `https://www.ticketmaster.com/event/${availabilityFromRedux.data.pmEvent.id}`}
                              target="_blank" rel="noopener noreferrer" underline="hover" color="primary">
                              {availabilityFromRedux.data.pmEvent.id}
                            </Link>
                          ) : null}
                        </EventField>
                      </Grid>
                      <Grid size={2}><EventField label="Name">{availabilityFromRedux.data.pmEvent.name}</EventField></Grid>
                      <Grid size={2}>
                        <EventField label="Date">
                          {availabilityFromRedux.data.pmEvent.eventLocalDate
                            ? formatDateTime(moment.parseZone(availabilityFromRedux.data.pmEvent.eventLocalDate))
                            : null}
                        </EventField>
                      </Grid>
                      <Grid size={3}><EventField label="Venue">{availabilityFromRedux.data.pmEvent.venue?.name}</EventField></Grid>
                      <Grid size={2}><EventField label="Performer">{availabilityFromRedux.data.pmEvent.performer?.name}</EventField></Grid>
                      <Grid size={2}><EventField label="Market">{availabilityFromRedux.data.pmEvent.marketType}</EventField></Grid>
                    </Grid>
                  )}
                </Stack>

              </Stack>
            </CardContent>
          </Card>
        </Grid>

            {/* Price Point Distribution */}
            <Grid size={{ xs: 12 }}>
              <DynamicChart
                title={`${PRIMARY_LABEL} - Price Points Availability`}
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
                logo={PRIMARY_LOGO}
                initialHiddenSeries={priceChartInitialHidden}
              />
            </Grid>

            {/* Capacity Table */}
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomDataGrid
                title={`${PRIMARY_LABEL} - Capacity Trends`}
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
                      "all":  87600,
                      "1h":   1,
                      "3h":   3,
                      "6h":   6,
                      "12h":  12,
                      "1d":   24,
                      "7d":   168,
                      "30d":  720,
                      "3m":   2160,
                      "6m":   4380,
                      "1y":   8760,
                    };
                    const lastHoursCount = hoursMap[activeTimeRange] ?? 24;
                    dispatch(getAvailability({ eventId, lastHoursCount }));
                  }
                }}
                height={400}
                headerComponent={capacityHeaderComponent}
                logo={PRIMARY_LOGO}
              />
            </Grid>

            {/* Section Breakdown */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DynamicChart
                title={`${PRIMARY_LABEL} - Sections Availability`}
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
                logo={PRIMARY_LOGO}
                initialHiddenSeries={sectionChartInitialHidden}
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
            dataset={filteredCombinedSalesChartDataset}
            chartConfig={enhancedSalesChartConfig}
            loading={loading.sales || loading.vividSales || loading.stubhubSales}
            timeRange={salesChart.timeRange}
            interval={salesChart.interval}
            onTimeRangeChange={salesChart.setTimeRange}
            onIntervalChange={salesChart.setInterval}
            timeRangeOptions={TIME_RANGE_OPTIONS}
            intervalOptionsMap={INTERVAL_OPTIONS_MAP}
            height={400}
            logo={undefined}
            customLogoComponent={
              (activeSourcesInFilter.hasSeatGeek || activeSourcesInFilter.hasVivid || activeSourcesInFilter.hasStubHub) ? (
                <Stack direction="row" spacing={0.5}>
                  {activeSourcesInFilter.hasSeatGeek && (
                    <Box
                      component="img"
                      src={SEATGEEK_LOGO}
                      alt="SeatGeek Logo"
                      sx={{ width: 24, height: 24, objectFit: "contain" }}
                    />
                  )}
                  {activeSourcesInFilter.hasVivid && (
                    <Box
                      component="img"
                      src={VIVID_LOGO}
                      alt="Vivid Seats Logo"
                      sx={{ width: 24, height: 24, objectFit: "contain" }}
                    />
                  )}
                  {activeSourcesInFilter.hasStubHub && (
                    <Box
                      component="img"
                      src={STUBHUB_LOGO}
                      alt="StubHub Logo"
                      sx={{ width: 24, height: 24, objectFit: "contain" }}
                    />
                  )}
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
            isLoading={loading.sales || loading.vividSales || loading.stubhubSales}
            error={error.sales || error.vividSales || error.stubhubSales}
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
              refetch.stubhubSales();
            }}
            height={400}
            headerComponent={salesHeaderComponent}
            logo={SEATGEEK_LOGO}
          />
        </Grid>

        {/* Analysis Logs Data Grid */}
        <Grid size={{ xs: 12 }}>
          <CustomDataGrid
            title="Buy Recommendations"
            rows={analysisLogsFromRedux.rows.data}
            rowCount={analysisLogsFromRedux.rows.total}
            columns={analysisLogsColumns}
            isLoading={analysisLogsFromRedux.loading}
            error={analysisLogsFromRedux.error}
            paginationModel={analysisLogsPaginationModel}
            setPaginationModel={setAnalysisLogsPaginationModel}
            sortingModel={analysisLogsSortModel}
            setSortingModel={setAnalysisLogsSortModel}
            filterModel={analysisLogsFilterModel}
            setFilterModel={setAnalysisLogsFilterModel}
            onRefresh={handleRefreshAnalysisLogs}
            height={400}
            headerComponent={analysisLogsHeaderComponent}
          />
        </Grid>
      </Grid>

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
