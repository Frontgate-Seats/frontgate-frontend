import * as React from "react";
import { useSelector } from "react-redux";
import { Stack, Grid, Typography, Link, Button } from "@mui/material";

import type { RootState } from "../store";
import { getTrades } from "../store/slices/trades.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { formatDateTime } from "../shared/utils/dateTime.util";
import { useDataGridQueryParams } from "../hooks/useDataGridQueryParams";

export default function TradesPage() {
  const dispatch = useAppDispatch();

  const {
    rows: { data: trades, total },
    loading: tradesLoading,
    error: tradesError,
  } = useSelector((state: RootState) => state.trades);

  const defaultTradesFilter = React.useMemo(() => ({ items: [] }), []);

  const { paginationModel, setPaginationModel, sortModel, setSortModel, filterModel, setFilterModel } =
    useDataGridQueryParams({
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
    dispatch(getTrades({
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      sortFields: sortModel,
      filters: filterModel,
    }));
  }, [dispatch, paginationModel.page, paginationModel.pageSize, sortModel, filterModel]);

  const handleRefresh = React.useCallback(() => {
    dispatch(getTrades({
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      sortFields: sortModel,
      filters: filterModel,
    }));
  }, [dispatch, paginationModel.page, paginationModel.pageSize, sortModel, filterModel]);

  const columns: CustomGridColDef[] = [
    // ── Joined from event_analysis_logs (display only) ──────────────
    {
      field: "event_id",
      headerName: "Event ID",
      width: 120,
      type: "string",
      sortable: false,
      filterable: false,
      renderCell: (params) => {
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
    },
    {
      field: "utc_date",
      headerName: "Event Date",
      width: 150,
      type: "dateTime",
      sortable: false,
      filterable: false,
      valueGetter: (value: any) => (value ? new Date(value) : null),
      valueFormatter: (value) => (value ? formatDateTime(value) : "-"),
    },
    {
      field: "venue_name",
      headerName: "Venue",
      width: 180,
      type: "string",
      sortable: false,
      filterable: false,
    },

    // ── Direct columns on event_buy_listings_logs ────────────────────
    {
      field: "vs_section",
      headerName: "Section",
      width: 120,
      type: "string",
    },
    {
      field: "row",
      headerName: "Row",
      width: 80,
      type: "string",
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
      renderCell: (params) => (
        <Typography fontWeight={600} color="text.primary">
          ${params.value?.toFixed?.(2) ?? "0.00"}
        </Typography>
      ),
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
      renderCell: (params) => (
        <Typography color="text.secondary">
          ${params.value?.toFixed?.(2) ?? "0.00"}
        </Typography>
      ),
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
      width: 140,
      type: "singleSelect",
      valueOptions: ["BUY", "STRONG_BUY", "CONVICTION_BUY"],
      renderCell: (params) => {
        const confidence = params.value;
        const color =
          confidence === "CONVICTION_BUY" ? "success.main"
          : confidence === "STRONG_BUY" ? "warning.main"
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
      valueFormatter: (value) => (value ? formatDateTime(value) : "-"),
    },
    {
      field: "buy",
      headerName: "Actions",
      width: 100,
      sortable: false,
      filterable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
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
            Buy
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
            rows={trades}
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
