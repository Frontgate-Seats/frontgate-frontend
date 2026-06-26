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
  GlobalStyles,
} from "@mui/material";
import {
  BarChart,
  KeyboardArrowDown,
  KeyboardArrowRight,
  Map as MapIcon,
} from "@mui/icons-material";
import type { RootState } from "../store";
import { getTrades } from "../store/slices/trades.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { formatDateTime } from "../shared/utils/dateTime.util";
import { useDataGridQueryParams } from "../hooks/useDataGridQueryParams";
import TradeDetailPanel, { TRADE_DETAIL_PANEL_HEIGHT } from "../components/trades/TradeDetailPanel";
import TradeInfoButton from "../components/trades/TradeInfoButton";
import type { Trade } from "../shared/types/trade.types";
import { usePurchaseModal } from "../components/common/PurchaseModal";
import moment from "moment";

// ── Display row types ─────────────────────────────────────────────────────────
type ParentRow = Trade & { _rowType: "parent" };
type DetailRow = { id: string; _rowType: "detail"; _parentRow: Trade };
type DisplayRow = ParentRow | DetailRow;

const DETAIL_ROW_HEIGHT_WITH_LISTINGS = TRADE_DETAIL_PANEL_HEIGHT;
const DETAIL_ROW_HEIGHT_NO_LISTINGS = 240;

export default function TradesPage() {
  const dispatch = useAppDispatch();
  const { openPurchaseModal } = usePurchaseModal();

  const {
    rows: { data: trades, total },
    loading: tradesLoading,
    error: tradesError,
  } = useSelector((state: RootState) => state.trades);

  // ── Expanded rows ─────────────────────────────────────────────────────────
  const [expanded, setExpanded] = React.useState<Record<string | number, boolean>>({});
  const toggleRow = React.useCallback((id: string | number) => {
    setExpanded((prev) => {
      const isOpen = !!prev[id];
      // Close all, then toggle the clicked one — only one open at a time
      return isOpen ? {} : { [id]: true };
    });
  }, []);

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
    { field: "event_id", type: "number" },
      { field: "event_name", type: "string" },
      { field: "local_date", type: "dateTime" },
      { field: "venue_name", type: "string" },
      { field: "vs_section", type: "string" },
      { field: "row", type: "string" },
      { field: "quantity", type: "number" },
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
  const totalColumns = 14; // expand+view+info col + 13 data cols

  const displayRows = React.useMemo<DisplayRow[]>(() => {
    const rows: DisplayRow[] = [];
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

  // ── When sort changes, close all expanded rows to prevent visual inconsistencies ────
  const prevSortModel = React.useRef(sortModel);
  React.useEffect(() => {
    if (JSON.stringify(prevSortModel.current) !== JSON.stringify(sortModel)) {
      setExpanded({});
      prevSortModel.current = sortModel;
    }
  }, [sortModel]);

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: CustomGridColDef[] = [
    // Expand + info + chart + map — spans ALL columns on detail rows via colSpan
    {
      field: "__expand",
      headerName: "",
      width: 120,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      colSpan: (_value: any, row: any) =>
        row._rowType === "detail" ? totalColumns : 1,
      renderCell: (params) => {
        if (params.row._rowType === "detail") {
          const parentTrade = params.row._parentRow;
          return (
            <Box sx={{ width: "100%", height: "100%" }}>
              <TradeDetailPanel
                trade={parentTrade}
                onBuyClick={(listing) => {
                  openPurchaseModal(
                    {
                      id: listing.id,
                      row: listing.row,
                      section_name: listing.section_name,
                      price: listing.price,
                      quantity: listing.quantity,
                      splits: listing.splits || [listing.quantity],
                    },
                    {
                      id: String(parentTrade.event_id),
                      name: parentTrade.event_name || "",
                      local_date: parentTrade.local_date || undefined,
                      venue_name: parentTrade.venue_name || "",
                      primary_performer_name: parentTrade.primary_performer_name || "",
                      event_url: parentTrade.vs_web_path
                        ? `https://www.vividseats.com${parentTrade.vs_web_path}`
                        : undefined,
                    },
                  );
                }}
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
            <TradeInfoButton trade={params.row} />
            <Tooltip title="View Event Details">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `/events/${params.row.event_id}`,
                    "_blank",
                  );
                }}
                disabled={!params.row.event_id}
                sx={{ display: params.row.event_id ? undefined : "none" }}
              >
                <BarChart fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Listings">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `/listings/${params.row.event_id}`,
                    "_blank",
                  );
                }}
                disabled={!params.row.event_id}
                sx={{ display: params.row.event_id ? undefined : "none" }}
              >
                <MapIcon fontSize="small" />
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
      type: "number",
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
      renderCell: (params) => {
        if (params.row._rowType === "detail") return null;
        return params.value;
      },
    },
    {
      field: "local_date",
      headerName: "Event Date",
      width: 150,
      type: "dateTime",
      valueGetter: (value: any) => (value ? new Date(value) : null),
      valueFormatter: (value: any) => (value ? formatDateTime(moment.parseZone(value)) : "-"),
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
      min: 0,
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
        const trade = params.row as Trade;
        if (!trade.event_id || !trade.listing_id) return null;
        return (
          <Button
            variant="contained"
            size="small"
            onClick={(e: any) => {
              e.stopPropagation();
              openPurchaseModal(
                {
                  id: trade.listing_id!,
                  row: trade.row || "",
                  section_name: trade.vs_section || "",
                  price: trade.max_buy_price || 0,
                  quantity: trade.quantity || 1,
                  splits: trade.quantity ? [trade.quantity] : [1],
                },
                {
                  id: String(trade.event_id),
                  name: trade.event_name || "",
                  local_date: trade.local_date || undefined,
                  venue_name: trade.venue_name || "",
                  primary_performer_name: trade.primary_performer_name || "",
                  event_url: trade.vs_web_path
                    ? `https://www.vividseats.com${trade.vs_web_path}`
                    : undefined,
                },
              );
            }}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Buy
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <GlobalStyles styles={{
        ".trade-row-expanded": {
          backgroundColor: "rgba(25, 118, 210, 0.08) !important",
          borderLeft: "3px solid #1976d2",
          "&:hover": {
            backgroundColor: "rgba(25, 118, 210, 0.13) !important",
          },
        },
      }} />
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
            getRowHeight={(params: any) => {
              if (params.model._rowType !== "detail") return null;
              return params.model._parentRow?.event_id
                ? DETAIL_ROW_HEIGHT_WITH_LISTINGS
                : DETAIL_ROW_HEIGHT_NO_LISTINGS;
            }}
            getRowClassName={(params: any) => {
              if (params.row._rowType === "detail") return "trade-detail-row";
              if (expanded[params.row.id]) return "trade-row-expanded";
              return "";
            }}
            headerComponent={
              <Typography variant="h6" fontWeight={600}>
                Ticket Trades
              </Typography>
            }
            isFullHeight={true}
          />
        </Grid>
      </Grid>
    </Stack>
    </>
  );
}
