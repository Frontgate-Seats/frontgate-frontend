import * as React from "react";
import { useSelector } from "react-redux";
import {
  Stack,
  Grid,
  Typography,
  Link,
  Button,
  Tooltip,
  IconButton,
  Box,
} from "@mui/material";
import {
  BarChart,
  KeyboardArrowDown,
  KeyboardArrowRight,
} from "@mui/icons-material";
import type { RootState } from "../store";
import { getTrades } from "../store/slices/trades.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { formatDateTime } from "../shared/utils/dateTime.util";
import { useDataGridQueryParams } from "../hooks/useDataGridQueryParams";
import TradeDetailPanel from "../components/trades/TradeDetailPanel";
import type { ListingsCache, ListingsCacheEntry } from "../components/trades/TradeDetailPanel";

const DETAIL_ROW_HEIGHT = 620;

export default function TradesPage() {
  const dispatch = useAppDispatch();

  const {
    rows: { data: trades, total },
    loading: tradesLoading,
    error: tradesError,
  } = useSelector((state: RootState) => state.trades);

  // ── Listings cache — survives DataGrid row virtualisation ─────────────────
  // Declared before toggleRow so the callback closure can reference it safely.
  const listingsCache = React.useRef<ListingsCache>({});
  const handleCacheUpdate = React.useCallback(
    (eventId: string, entry: ListingsCacheEntry) => {
      listingsCache.current[eventId] = entry;
    },
    [],
  );

  // ── Expanded rows ─────────────────────────────────────────────────────────
  const [expanded, setExpanded] = React.useState<Record<string | number, boolean>>({});
  const toggleRow = React.useCallback((id: string | number) => {
    setExpanded((prev) => {
      const isCurrentlyOpen = !!prev[id];
      // Clear the listings cache when collapsing so re-open triggers a fresh fetch
      if (isCurrentlyOpen) {
        const trade = trades.find((t) => t.id === id);
        if (trade?.event_id) {
          delete listingsCache.current[String(trade.event_id)];
        }
      }
      return { ...prev, [id]: !isCurrentlyOpen };
    });
  }, [trades]);

  // ── Filter / sort / pagination ────────────────────────────────────────────
  const defaultTradesFilter = React.useMemo(() => ({ items: [] }), []);

  const {
    paginationModel,
    setPaginationModel,
    sortModel,
    setSortModel,
    filterModel,
    setFilterModel,
  } = useDataGridQueryParams({
    columns: [
      { field: "vs_section", type: "string" },
      { field: "max_buy_price", type: "number" },
      { field: "projected_sell_price", type: "number" },
      { field: "estimated_margin_percent", type: "number" },
      { field: "confidence_level", type: "singleSelect" },
      { field: "created_at", type: "dateTime" },
    ],
    defaultPaginationModel: { page: 0, pageSize: 25 },
    defaultSortModel: [{ field: "created_at", sort: "desc" }],
    defaultFilterModel: defaultTradesFilter,
  });

  React.useEffect(() => {
    dispatch(
      getTrades({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      }),
    );
  }, [dispatch, paginationModel.page, paginationModel.pageSize, sortModel, filterModel]);

  const handleRefresh = React.useCallback(() => {
    dispatch(
      getTrades({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      }),
    );
  }, [dispatch, paginationModel.page, paginationModel.pageSize, sortModel, filterModel]);

  React.useEffect(() => {
    const interval = setInterval(handleRefresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  // ── Build display rows: inject a detail row after each expanded parent ────
  const totalColumns = 14; // single expand+view col + 13 data cols
  const displayRows = React.useMemo(() => {
    const rows: any[] = [];
    trades.forEach((trade) => {
      rows.push({ ...trade, _rowType: "parent" });
      if (expanded[trade.id]) {
        rows.push({
          id: `__detail__${trade.id}`,
          _rowType: "detail",
          _parentRow: trade,
        });
      }
    });
    return rows;
  }, [trades, expanded]);

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: CustomGridColDef[] = [
    // Expand toggle + view event — spans ALL columns on detail rows via colSpan
    {
      field: "__expand",
      headerName: "",
      width: 80,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      colSpan: (_value: any, row: any) =>
        row._rowType === "detail" ? totalColumns : 1,
      renderCell: (params) => {
        if (params.row._rowType === "detail") {
          return (
            <Box sx={{ width: "100%", height: "100%", overflow: "auto" }}>
              <TradeDetailPanel
                trade={params.row._parentRow}
                listingsCache={listingsCache}
                onCacheUpdate={handleCacheUpdate}
              />
            </Box>
          );
        }
        const isOpen = !!expanded[params.row.id];
        return (
          <Stack direction="row" alignItems="center">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleRow(params.row.id);
              }}
              aria-label={isOpen ? "Collapse" : "Expand"}
            >
              {isOpen ? (
                <KeyboardArrowDown fontSize="small" />
              ) : (
                <KeyboardArrowRight fontSize="small" />
              )}
            </IconButton>
            <Tooltip title="View Event Details">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `/functions/v1/events-api/ui/events/${params.row.event_id}`,
                    "_blank",
                  );
                }}
              >
                <BarChart fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
    {
      field: "event_id",
      headerName: "Event ID",
      width: 120,
      type: "string",
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        return (
          <Link
            href={`https://www.vividseats.com${params.row.vs_web_path}?showDetails=${params.row.listing_id}`}
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
      field: "event_name",
      headerName: "Event",
      flex: 1,
      minWidth: 200,
      type: "string",
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        return params.value;
      },
    },
    {
      field: "utc_date",
      headerName: "Event Date",
      width: 150,
      type: "dateTime",
      sortable: false,
      filterable: false,
      valueGetter: (value: any) => (value ? new Date(value) : null),
      valueFormatter: (value: any) => (value ? formatDateTime(value) : "-"),
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        return params.formattedValue ?? "-";
      },
    },
    {
      field: "venue_name",
      headerName: "Venue",
      width: 150,
      type: "string",
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        return params.value;
      },
    },
    {
      field: "vs_section",
      headerName: "Section",
      width: 120,
      type: "string",
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        return params.value;
      },
    },
    {
      field: "row",
      headerName: "Row",
      width: 80,
      type: "string",
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        return params.value;
      },
    },
    {
      field: "quantity",
      headerName: "Qty",
      width: 70,
      align: "center",
      headerAlign: "center",
      type: "number",
      min: 0,
      max: 20,
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        return params.value;
      },
    },
    {
      field: "max_buy_price",
      headerName: "Buy Price",
      width: 110,
      type: "number",
      align: "right",
      headerAlign: "right",
      min: 0,
      max: 10000,
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        return (
          <Typography fontWeight={600} color="text.primary">
            ${params.value?.toFixed?.(2) ?? "0.00"}
          </Typography>
        );
      },
    },
    {
      field: "projected_sell_price",
      headerName: "Proj. Sell",
      width: 110,
      type: "number",
      align: "right",
      headerAlign: "right",
      min: 0,
      max: 10000,
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        return (
          <Typography color="text.secondary">
            ${params.value?.toFixed?.(2) ?? "0.00"}
          </Typography>
        );
      },
    },
    {
      field: "estimated_margin_percent",
      headerName: "Margin %",
      width: 100,
      type: "number",
      align: "right",
      headerAlign: "right",
      min: -100,
      max: 500,
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        const margin = params.value;
        return (
          <Typography fontWeight={600} color={margin > 0 ? "success.main" : "error.main"}>
            {margin?.toFixed?.(2) ?? "0.00"}%
          </Typography>
        );
      },
    },
    {
      field: "confidence_level",
      headerName: "Confidence",
      width: 120,
      type: "singleSelect",
      valueOptions: ["BUY", "STRONG_BUY", "CONVICTION_BUY"],
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        const confidence = params.value;
        const color =
          confidence === "CONVICTION_BUY"
            ? "success.main"
            : confidence === "STRONG_BUY"
              ? "warning.main"
              : "error.main";
        return (
          <Typography variant="body2" fontWeight={600} color={color}>
            {confidence ?? "-"}
          </Typography>
        );
      },
    },
    {
      field: "created_at",
      headerName: "Rec. Date",
      width: 160,
      type: "dateTime",
      valueGetter: (value: any) => (value ? new Date(value) : null),
      valueFormatter: (value: any) => (value ? formatDateTime(value) : "-"),
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        return params.formattedValue ?? "-";
      },
    },
    {
      field: "trade",
      headerName: "Actions",
      width: 150,
      sortable: false,
      filterable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        const eventId = params.row.event_id;
        const listingId = params.row.listing_id;
        if (!eventId) return null;
        return (
          <Button
            component={Link}
            href={`/functions/v1/events-api/ui/listings/${eventId}?listing_id=${listingId}`}
            variant="contained"
            size="small"
            target="_blank"
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Make Trade
          </Button>
        );
      },
    },
  ];

  return (
    <Stack
      padding={3}
      sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <Grid container spacing={3}>
        <Grid
          size={{ xs: 12 }}
          sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          <CustomDataGrid
            title="Ticket Trades"
            rows={displayRows}
            rowCount={total}
            columns={columns}
            isLoading={tradesLoading}
            error={tradesError as any}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            sortingModel={sortModel}
            setSortingModel={setSortModel}
            filterModel={filterModel}
            setFilterModel={setFilterModel}
            onRefresh={handleRefresh}
            getRowHeight={(params: any) =>
              params.model._rowType === "detail" ? DETAIL_ROW_HEIGHT : null 
            }
            getRowClassName={(params: any) =>
              params.row._rowType === "detail" ? "trade-detail-row" : ""
            }
            headerComponent={
              <Typography variant="h6" fontWeight={600}>
                Ticket Trades
              </Typography>
            }
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
