import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Typography,
  Grid,
  Alert,
  Link,
  Stack,
  Chip,
} from "@mui/material";
import type { AppDispatch, RootState } from "../store";
import { getPurchases } from "../store/slices/purchases.slice";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import PurchaseCommentCell from "../components/purchases/PurchaseCommentCell";
import UpdatePriceCell from "../components/purchases/UpdatePriceCell";
import PurchaseSummaryBar from "../components/purchases/PurchaseSummaryBar";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { useDataGridQueryParams } from "../hooks/useDataGridQueryParams";
import { formatDateTime } from "../shared/utils/dateTime.util";

// ─── Days-to-event helpers ────────────────────────────────────────────────────

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getDaysToEvent(eventUtcDate: string | null | undefined): number | null {
  if (!eventUtcDate) return null;
  const eventMs = new Date(eventUtcDate).getTime();
  if (isNaN(eventMs)) return null;
  return Math.ceil((eventMs - Date.now()) / MS_PER_DAY);
}

function getUrgencyRowClass(
  days: number | null,
  inventoryStatus?: string,
  profit?: number | null,
): string {
  if (days === null) return "";
  if (inventoryStatus === "DEPLETED")
    return profit != null && profit < 0 ? "urgency-row-loss" : "urgency-row-win";
  if (inventoryStatus === "UNSOLD") return "urgency-row-loss";
  if (days < 1) return "urgency-row-critical";
  if (days < 3) return "urgency-row-warning";
  return "urgency-row-safe";
}

function formatDaysLabel(days: number | null): string {
  if (days === null) return "-";
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

// ─── Cell renderers ───────────────────────────────────────────────────────────

function MoneyCell({
  value,
  fontWeight = 500,
}: {
  value: number | null | undefined;
  fontWeight?: number;
}) {
  if (value == null)
    return <Typography variant="body2" color="text.disabled">—</Typography>;
  return (
    <Typography variant="body2" fontWeight={fontWeight} color="text.primary">
      ${value.toFixed(2)}
    </Typography>
  );
}

const STATUS_OPTIONS = [
  { value: "CREATED", label: "CREATED" },
  { value: "CONFIRMED", label: "CONFIRMED" },
  { value: "PAYMENTS_CAPTURED", label: "PAYMENTS_CAPTURED" },
  { value: "CANCELLED", label: "CANCELLED" },
  { value: "DELIVERED", label: "DELIVERED" },
];

const INVENTORY_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "AVAILABLE" },
  { value: "ON_HOLD", label: "ON_HOLD" },
  { value: "DEPLETED", label: "SOLD" },
  { value: "UNSOLD", label: "UNSOLD" },
  { value: "PARTIAL_SOLD", label: "PARTIAL_SOLD" },
];


// ─── Page ─────────────────────────────────────────────────────────────────────

const PurchasesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    loading: purchasesLoading,
    rows: { data: purchases, total },
    error: purchasesError,
  } = useSelector((state: RootState) => state.purchases);

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
      { field: "event_utc_date", type: "dateTime" },
      { field: "days_to_event", type: "number" },
      { field: "created_at", type: "dateTime" },
      { field: "listing_id", type: "string" },
      { field: "purchase_id", type: "string" },
      { field: "inventory_id", type: "string" },
      { field: "section", type: "string" },
      { field: "row", type: "string" },
      { field: "quantity", type: "number" },
      { field: "total_amount", type: "number" },
      { field: "list_price", type: "number" },
      { field: "sold_price", type: "number" },
      { field: "sold_quantity", type: "number" },
      { field: "sold_at", type: "dateTime" },
      { field: "price_per", type: "number" },
      { field: "profit", type: "number" },
      { field: "status", type: "singleSelect" },
      { field: "inventory_status", type: "singleSelect" },
      { field: "is_auto_trade", type: "singleSelect" },
    ],
    defaultPaginationModel: { page: 0, pageSize: 25 },
    defaultSortModel: [{ field: "event_utc_date", sort: "asc" }],
    defaultFilterModel: {
      items: [
        {
          id: "event_utc_date-default",
          field: "event_utc_date",
          operator: "onOrAfter",
          value: new Date().toISOString(),
        },
      ],
    },
  });

  const effectiveSort = React.useMemo(
    () =>
      sortModel.map((s) =>
        s.field === "days_to_event" ? { ...s, field: "event_utc_date" } : s,
      ),
    [sortModel],
  );

  React.useEffect(() => {
    dispatch(
      getPurchases({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: effectiveSort,
        filters: filterModel,
      }),
    );
  }, [dispatch, paginationModel, effectiveSort, filterModel]);

  const handleRefresh = React.useCallback(() => {
    dispatch(
      getPurchases({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: effectiveSort,
        filters: filterModel,
      }),
    );
  }, [dispatch, paginationModel, effectiveSort, filterModel]);

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: CustomGridColDef[] = [
    {
      field: "llm_result_comment",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <PurchaseCommentCell
          purchaseRowId={params.row.id}
          comment={params.row.llm_result_comment}
        />
      ),
    },
    {
      field: "event_id",
      headerName: "Event ID",
      width: 140,
      type: "number",
      align: "left",
      headerAlign: "left",
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
      field: "event_name",
      headerName: "Event",
      flex: 1,
      minWidth: 160,
      type: "string",
    },
    {
      field: "event_utc_date",
      headerName: "Event Date (UTC)",
      width: 170,
      type: "dateTime",
      valueGetter: (value: any) => (value ? new Date(value) : null),
      valueFormatter: (value: any) => (value ? formatDateTime(value) : "-"),
    },
    {
      field: "days_to_event",
      headerName: "Days to Event",
      width: 130,
      sortable: true,
      filterable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const days = getDaysToEvent(params.row.event_utc_date);
        return (
          <Typography variant="body2" color="text.primary">
            {formatDaysLabel(days)}
          </Typography>
        );
      },
    },
    {
      field: "created_at",
      headerName: "Purchase Date",
      width: 170,
      type: "dateTime",
      valueGetter: (value: any) => (value ? new Date(value) : null),
      valueFormatter: (value: any) => (value ? formatDateTime(value) : "-"),
    },
    {
      field: "purchase_id",
      headerName: "PO ID",
      type: "string",
      width: 140,
      renderCell: (params) => (
        <Link
          href={`https://skybox.vividseats.com/purchases/${params.value}`}
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
      field: "inventory_id",
      headerName: "Inventory ID",
      type: "string",
      width: 140,
    },
    {
      field: "section",
      headerName: "Section",
      type: "string",
      width: 140,
    },
    {
      field: "row",
      headerName: "Row",
      type: "string",
      width: 90,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "quantity",
      headerName: "Qty",
      width: 80,
      align: "center",
      headerAlign: "center",
      type: "number",
      min: 0,
      max: 1000,
    },
    {
      field: "total_amount",
      headerName: "Total Cost",
      width: 110,
      type: "number",
      min: 0,
      max: 10000,
      align: "right",
      headerAlign: "right",
      headerClassName: "group-separator",
      cellClassName: "group-separator",
      renderCell: (params) => <MoneyCell value={params.value} fontWeight={600} />,
    },
    {
      field: "price_per",
      headerName: "Unit Cost",
      width: 100,
      type: "number",
      sortable: false,
      filterable: false,
      align: "right",
      headerAlign: "right",
      valueGetter: (_, row) =>
        row.total_amount && row.quantity ? row.total_amount / row.quantity : null,
      renderCell: (params) => <MoneyCell value={params.value} />,
    },
    {
      field: "list_price",
      headerName: "List Price",
      width: 150,
      type: "number",
      sortable: true,
      filterable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => {
        const isPastEvent = params.row.event_utc_date
          ? new Date(params.row.event_utc_date).getTime() <= Date.now()
          : false;
        if (isPastEvent)
          return <Typography variant="body2" color="text.disabled">—</Typography>;
        return (
          <UpdatePriceCell
            rowId={params.row.id}
            inventoryId={params.row.inventory_id}
            currentPrice={params.row.list_price}
            eventUtcDate={params.row.event_utc_date}
            inventoryStatus={params.row.inventory_status}
          />
        );
      },
    },
    {
      field: "sold_price",
      headerName: "Sold Price",
      width: 110,
      type: "number",
      sortable: true,
      filterable: true,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => <MoneyCell value={params.value} fontWeight={600} />,
    },
    {
      field: "sold_quantity",
      headerName: "Sold Qty",
      width: 90,
      type: "number",
      sortable: true,
      filterable: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const soldQty = params.value;
        if (soldQty == null)
          return <Typography variant="body2" color="text.disabled">—</Typography>;
        return <Typography variant="body2">{soldQty}</Typography>;
      },
    },
    {
      field: "profit",
      headerName: "Profit",
      width: 110,
      type: "number",
      sortable: true,
      filterable: true,
      align: "right",
      headerAlign: "right",
      headerClassName: "group-separator",
      cellClassName: "group-separator",
      renderCell: (params) => {
        const profit = params.value;
        if (profit == null)
          return <Typography variant="body2" color="text.disabled">—</Typography>;
        const isNegative = profit < 0;
        return (
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ color: isNegative ? "error.main" : "success.main" }}
          >
            {isNegative ? "-" : ""}${Math.abs(profit).toFixed(2)}
          </Typography>
        );
      },
    },
    {
      field: "profit_pct",
      headerName: "Margin %",
      width: 100,
      sortable: false,
      filterable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => {
        const profit = params.row.profit;
        const totalAmount = params.row.total_amount;
        if (profit == null || !totalAmount)
          return <Typography variant="body2" color="text.disabled">—</Typography>;
        const pct = (profit / totalAmount) * 100;
        const isNegative = pct < 0;
        return (
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ color: isNegative ? "error.main" : "success.main" }}
          >
            {isNegative ? "" : "+"}
            {pct.toFixed(1)}%
          </Typography>
        );
      },
    },
    {
      field: "status",
      headerName: "Purchase Status",
      headerAlign: "center",
      align: "center",
      width: 160,
      type: "singleSelect",
      valueOptions: STATUS_OPTIONS,
      headerClassName: "group-separator",
      cellClassName: "group-separator",
    },
    {
      field: "inventory_status",
      headerName: "Inventory Status",
      headerAlign: "center",
      align: "center",
      width: 160,
      type: "singleSelect",
      valueOptions: INVENTORY_STATUS_OPTIONS,
      valueFormatter: (value: any) => (value === "DEPLETED" ? "SOLD" : value),
    },
    {
      field: "is_auto_trade",
      headerName: "Trade Type",
      width: 120,
      type: "singleSelect",
      valueOptions: [
        { value: "true", label: "Auto Trade" },
        { value: "false", label: "Manual" },
      ],
      valueGetter: (value: any) => (value ? "true" : "false"),
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const isAuto = params.row.is_auto_trade;
        return (
          <Chip
            label={isAuto ? "Auto Trade" : "Manual"}
            size="small"
            color={isAuto ? "primary" : "default"}
            variant={isAuto ? "filled" : "outlined"}
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          />
        );
      },
    },
  ];

  return (
    <Stack
      padding={3}
      sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <Grid
        size={{ xs: 12 }}
        sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <Grid
          size={{ xs: 12 }}
          sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          <PurchaseSummaryBar />
          {purchasesError ? (
            <Alert severity="error">{purchasesError}</Alert>
          ) : (
            <CustomDataGrid
              title="Inventory"
              columnGroupingModel={[
                {
                  headerAlign: "center",
                  groupId: "common",
                  headerName: "Common",
                  children: [
                    { field: "llm_result_comment" },
                    { field: "event_id" },
                    { field: "event_name" },
                    { field: "event_utc_date" },
                    { field: "days_to_event" },
                    { field: "created_at" },
                    { field: "inventory_id" },
                    { field: "purchase_id" },
                    { field: "section" },
                    { field: "row" },
                    { field: "quantity" },
                  ],
                },
                {
                  headerAlign: "center",
                  groupId: "purchase",
                  headerName: "Purchase",
                  children: [
                    { field: "total_amount" },
                    { field: "price_per" },
                    { field: "list_price" },
                  ],
                },
                {
                  headerAlign: "center",
                  groupId: "sold",
                  headerName: "Sold",
                  children: [
                    { field: "sold_price" },
                    { field: "sold_quantity" },
                  ],
                },
                {
                  headerAlign: "center",
                  groupId: "profit_margin",
                  headerName: "Profit & Margin",
                  children: [
                    { field: "profit" },
                    { field: "profit_pct" },
                  ],
                },
                {
                  headerAlign: "center",
                  groupId: "status_group",
                  headerName: "Status",
                  children: [
                    { field: "status" },
                    { field: "inventory_status" },
                    { field: "is_auto_trade" },
                  ],
                },
              ]}
              headerComponent={
                <Typography component="h2" sx={{ m: 0, fontSize: "1.5rem", fontWeight: 700 }}>
                  Inventory
                </Typography>
              }
              rows={purchases}
              rowCount={total}
              columns={columns}
              getRowClassName={(params) =>
                getUrgencyRowClass(
                  getDaysToEvent(params.row.event_utc_date),
                  params.row.inventory_status,
                  params.row.profit,
                )
              }
              isLoading={purchasesLoading}
              error={purchasesError as any}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              sortingModel={sortModel}
              setSortingModel={setSortModel}
              filterModel={filterModel}
              setFilterModel={setFilterModel}
              onRefresh={handleRefresh}
              isFullHeight={true}
            />
          )}
        </Grid>
      </Grid>
    </Stack>
  );
};

export default PurchasesPage;
