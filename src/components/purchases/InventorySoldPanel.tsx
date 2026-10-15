import * as React from "react";
import {
  Box,
  Typography,
  Link,
} from "@mui/material";
import CustomDataGrid from "../common/datagrid/CustomDatagrid";
import { useClientFilters } from "../../hooks/useClientFilters";
import type { CustomGridColDef } from "../../shared/types/mui.type";
import { formatDateTime } from "../../shared/utils/dateTime.util";
import supabaseClient from "../../clients/supabase.client";
import { useRole } from "../../hooks/useRole";

// Sold-panel columns hidden from roles that may not see financials.
const SOLD_FINANCIAL_FIELDS = ["sale_total", "profit"];

// Fixed height of the expanded detail row — keep in sync with the value used
// in purchases.page.tsx so the grid sizes the detail row precisely.
export const INVENTORY_SOLD_PANEL_HEIGHT = 360;

// Height the inner CustomDataGrid occupies inside the panel.
const GRID_HEIGHT = 280;

// Shape of the sold_inventory rows we read. Only the fields we render.
interface SoldInventoryRow {
  id: string;
  inventory_id: string | null;
  invoice_id: string | null;
  order_id: string | null;
  listing_id: string | null;
  section: string | null;
  row: string | null;
  quantity_sold: number | null;
  purchase_cost: number | null;
  sale_total: number | null;
  list_price: number | null;
  profit: number | null;
  fulfillment_status: string | null;
  invoice_date: string | null;
  purchase_date: string | null;
}

export interface InventorySoldPanelProps {
  /** inventory.purchase_id — the join key into sold_inventory.purchase_ids[] */
  purchaseId: string | null | undefined;
}

const SKYBOX_SOLD_URL = (invoiceId: string) =>
  `https://skybox.vividseats.com/inventory/sold?invoiceId=${invoiceId}`;

// ─── Cell renderer ──────────────────────────────────────────────────────────

function MoneyText({
  value,
  bold = false,
  colored = false,
}: {
  value: number | null | undefined;
  bold?: boolean;
  colored?: boolean;
}) {
  if (value == null)
    return <Typography component="span" variant="body2" color="text.disabled">—</Typography>;
  const negative = value < 0;
  return (
    <Typography
      component="span"
      variant="body2"
      fontWeight={bold ? 700 : 500}
      sx={{
        color: colored ? (negative ? "error.main" : "success.main") : "text.primary",
      }}
    >
      {negative ? "-" : ""}${Math.abs(value).toFixed(2)}
    </Typography>
  );
}

/**
 * InventorySoldPanel — expanded-row detail for an inventory purchase.
 *
 * Shows every sold_inventory record tied to the purchase in a CustomDataGrid.
 * One inventory line can produce multiple sold rows (partial sales / re-listed
 * splits), so the join is on the SkyBox purchase id: inventory.purchase_id is
 * contained in sold_inventory.purchase_ids[] (the same `.contains` filter the
 * backend uses).
 */
export default function InventorySoldPanel({ purchaseId }: InventorySoldPanelProps) {
  const { canSeeFinancials } = useRole();
  const [rows, setRows] = React.useState<SoldInventoryRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!purchaseId) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabaseClient
      .from("sold_inventory")
      .select(
        "id, inventory_id, invoice_id, order_id, listing_id, section, row, quantity_sold, purchase_cost, sale_total, list_price, profit, fulfillment_status, invoice_date, purchase_date",
      )
      .contains("purchase_ids", [String(purchaseId)])
      .order("invoice_date", { ascending: false })
      .then(({ data, error: qErr }) => {
        if (cancelled) return;
        if (qErr) {
          setError(qErr.message);
          setRows([]);
        } else {
          setRows((data as SoldInventoryRow[]) ?? []);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [purchaseId]);

  // ── Columns ─────────────────────────────────────────────────────────────
  const columns: CustomGridColDef[] = React.useMemo(
    () => ([
      {
        field: "invoice_id",
        headerName: "Invoice ID",
        minWidth: 130,
        flex: 1,
        type: "string",
        renderCell: (params: any) => {
          if (!params.value) return "—";
          return (
            <Link
              href={SKYBOX_SOLD_URL(params.value)}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              {params.value}
            </Link>
          );
        },
      },
      {
        field: "invoice_date",
        headerName: "Invoice Date",
        minWidth: 150,
        flex: 1,
        type: "dateTime",
        valueGetter: (value: any) => (value ? new Date(value) : null),
        valueFormatter: (value: any) => (value ? formatDateTime(value) : "—"),
      },
      {
        field: "section",
        headerName: "Section",
        minWidth: 110,
        flex: 1,
        type: "string",
        valueFormatter: (value: any) => value ?? "—",
      },
      {
        field: "row",
        headerName: "Row",
        minWidth: 70,
        flex: 0.5,
        type: "string",
        valueFormatter: (value: any) => value ?? "—",
      },
      {
        field: "quantity_sold",
        headerName: "Qty Sold",
        minWidth: 90,
        flex: 0.5,
        type: "number",
        align: "right",
        headerAlign: "right",
        valueFormatter: (value: any) => (value == null ? "—" : value),
      },
      {
        field: "purchase_cost",
        headerName: "Cost",
        minWidth: 90,
        flex: 0.7,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (params: any) => <MoneyText value={params.value} />,
      },
      {
        field: "list_price",
        headerName: "List Price",
        minWidth: 100,
        flex: 0.7,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (params: any) => <MoneyText value={params.value} />,
      },
      {
        field: "sale_total",
        headerName: "Sale Total",
        minWidth: 100,
        flex: 0.7,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (params: any) => <MoneyText value={params.value} bold />,
      },
      {
        field: "profit",
        headerName: "Profit",
        minWidth: 100,
        flex: 0.7,
        type: "number",
        align: "right",
        headerAlign: "right",
        renderCell: (params: any) => <MoneyText value={params.value} bold colored />,
      },
      {
        field: "fulfillment_status",
        headerName: "Fulfillment",
        minWidth: 120,
        flex: 0.8,
        type: "singleSelect",
        valueOptions: ["PENDING", "COMPLETE"],
        valueFormatter: (value: any) => value ?? "—",
      },
    ] as CustomGridColDef[]).filter(
      (col) => canSeeFinancials || !SOLD_FINANCIAL_FIELDS.includes(col.field),
    ),
    [canSeeFinancials],
  );

  // ── Client-side filtering / sorting / pagination ──────────────────────────
  const {
    paginationModel,
    sortModel,
    filterModel,
    setPaginationModel,
    setSortModel,
    setFilterModel,
    paginatedRows,
    totalFilteredRows,
  } = useClientFilters({
    data: rows,
    columns,
    initialPaginationModel: { page: 0, pageSize: 5 },
    initialSortModel: [{ field: "invoice_date", sort: "desc" }],
  });

  return (
    <Box
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      sx={{
        width: "100%",
        height: INVENTORY_SOLD_PANEL_HEIGHT,
        px: 3,
        py: 2,
        bgcolor: "background.default",
        borderTop: "2px solid",
        borderColor: "primary.main",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Box sx={{ height: GRID_HEIGHT, width: "100%" }}>
        <CustomDataGrid
          title="Sold Inventory"
          headerComponent={
            <Typography variant="subtitle1" fontWeight={700}>
              Sold Inventory
            </Typography>
          }
          rows={paginatedRows}
          rowCount={totalFilteredRows}
          columns={columns}
          isLoading={loading}
          error={error ? new Error(error) : null}
          paginationModel={paginationModel}
          setPaginationModel={setPaginationModel}
          sortingModel={sortModel}
          setSortingModel={setSortModel}
          filterModel={filterModel}
          setFilterModel={setFilterModel}
          defaultFilterType="header"
          onRefresh={() => {}}
          height={GRID_HEIGHT}
          paginationMode="server"
          sortingMode="client"
        />
      </Box>
    </Box>
  );
}
