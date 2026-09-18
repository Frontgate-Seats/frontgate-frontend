import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Typography,
  Grid,
  Alert,
  Link,
  Stack,
  Chip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import type { AppDispatch, RootState } from "../store";
import { getPurchases } from "../store/slices/purchases.slice";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import PurchaseCommentCell from "../components/purchases/PurchaseCommentCell";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { useDataGridQueryParams } from "../hooks/useDataGridQueryParams";
import { formatDateTime } from "../shared/utils/dateTime.util";

// ─── Days-to-event helpers ────────────────────────────────────────────────────

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Whole days from now until the event.
 * Positive = upcoming, 0 = today, negative = past event.
 * null when there is no event date.
 */
function getDaysToEvent(eventUtcDate: string | null | undefined): number | null {
  if (!eventUtcDate) return null;
  const eventMs = new Date(eventUtcDate).getTime();
  if (isNaN(eventMs)) return null;
  return Math.ceil((eventMs - Date.now()) / MS_PER_DAY);
}

/**
 * Urgency row-background class based on days-to-event.
 * critical (red)   = less than 1 day out (or already past)
 * warning (yellow) = less than 3 days out
 * safe (green)     = 3+ days out (future events)
 * "" (none)        = no event date
 */
function getUrgencyRowClass(days: number | null): string {
  if (days === null) return "";
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

// Multi-select filter options for the status columns.
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
  // DB value stays DEPLETED; shown as SOLD for clarity.
  { value: "DEPLETED", label: "SOLD" },
];

// "Unsold" = everything except DEPLETED. Pre-selected by default so the grid
// opens showing only unsold inventory; the user can change the selection.
const UNSOLD_INVENTORY_STATUSES = ["AVAILABLE", "ON_HOLD"];

const PurchasesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    loading: purchasesLoading,
    rows: { data: purchases, total },
    error: purchasesError,
  } = useSelector((state: RootState) => state.purchases);

  const { paginationModel, setPaginationModel, sortModel, setSortModel, filterModel, setFilterModel } =
    useDataGridQueryParams({
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
        { field: "status", type: "singleSelect" },
        { field: "inventory_status", type: "singleSelect" },
        { field: "is_auto_trade", type: "singleSelect" },
      ],
      defaultPaginationModel: { page: 0, pageSize: 25 },
      // Soonest events first so the most urgent purchases are at the top.
      defaultSortModel: [{ field: "event_utc_date", sort: "asc" }],
      // Defaults: show only unsold inventory and hide past events. Both are
      // ordinary filter items, so the filter UI reflects them and the user can
      // change them directly.
      defaultFilterModel: {
        items: [
          {
            id: "inventory_status-default",
            field: "inventory_status",
            operator: "isAnyOf",
            value: UNSOLD_INVENTORY_STATUSES,
          },
          {
            id: "event_utc_date-default",
            field: "event_utc_date",
            operator: "onOrAfter",
            value: new Date().toISOString(),
          },
        ],
      },
    });

  // "Show Past Events" toggle: ON when there is no event_utc_date lower-bound
  // filter. Toggling it just adds/removes that one filter item.
  const showPastEvents = !filterModel.items.some(
    (i) => i.field === "event_utc_date" && i.operator === "onOrAfter",
  );

  const handleTogglePastEvents = (checked: boolean) => {
    setFilterModel((prev) => {
      const withoutDate = prev.items.filter(
        (i) => !(i.field === "event_utc_date" && i.operator === "onOrAfter"),
      );
      if (checked) {
        // Show past events → remove the "from now" lower bound.
        return { ...prev, items: withoutDate };
      }
      // Hide past events → add the "from now" lower bound back.
      return {
        ...prev,
        items: [
          ...withoutDate,
          {
            id: "event_utc_date-default",
            field: "event_utc_date",
            operator: "onOrAfter",
            value: new Date().toISOString(),
          },
        ],
      };
    });
  };

  // "Days to Event" is derived from event_utc_date, so a sort on that column
  // is translated to the real event_utc_date column. Fewer days = sooner event
  // = earlier date, so the sort direction is the same.
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
      field: "days_to_event",
      headerName: "Days to Event",
      width: 130,
      // Not a DB column — derived from event_utc_date. The header sort is
      // translated to event_utc_date in effectiveSort (fewer days = earlier
      // date, same direction). Filtering still targets event_utc_date.
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
      valueFormatter: (value) => (value ? formatDateTime(value) : "-"),
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
      headerName: "Total",
      width: 110,
      type: "number",
      min: 0,
      max: 10000,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Typography fontWeight={600} color="text.primary">
          ${params.value?.toFixed?.(2) || 0}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      headerAlign: "center",
      align: "center",
      width: 160,
      type: "singleSelect",
      valueOptions: STATUS_OPTIONS,
    },
    {
      field: "inventory_status",
      headerName: "Inventory Status",
      headerAlign: "center",
      align: "center",
      width: 160,
      type: "singleSelect",
      valueOptions: INVENTORY_STATUS_OPTIONS,
      // Display DEPLETED as SOLD (DB value is unchanged).
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
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Grid
        size={{ xs: 12 }}
        sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <Grid
          size={{ xs: 12 }}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {purchasesError ? (
            <Alert severity="error">{purchasesError}</Alert>
          ) : (
            <CustomDataGrid
              title="Purchases"
              headerComponent={
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                  sx={{ width: "100%" }}
                >
                  <Typography component="h2" sx={{ m: 0, fontSize: "1.5rem", fontWeight: 700 }}>
                    Purchases
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showPastEvents}
                        onChange={(e) => handleTogglePastEvents(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Show Past Events"
                    sx={{ mr: 0 }}
                  />
                </Stack>
              }
              rows={purchases}
              rowCount={total}
              columns={columns}
              getRowClassName={(params) =>
                getUrgencyRowClass(getDaysToEvent(params.row.event_utc_date))
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
            />
          )}
        </Grid>
      </Grid>
    </Stack>
  );
};

export default PurchasesPage;
