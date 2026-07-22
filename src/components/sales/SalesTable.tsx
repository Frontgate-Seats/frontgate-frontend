import * as React from "react";
import CustomDataGrid from "../common/datagrid/CustomDatagrid";
import { Box, Tooltip } from "@mui/material";
import { useClientFilters } from "../../hooks/useClientFilters";
import { formatDateTime } from "../../shared/utils/dateTime.util";
import type { CustomGridColDef } from "../../shared/types/mui.type";
import salesApi from "../../apis/sales.api";
import vividSalesApi from "../../apis/vividSales.api";
import stubhubSalesApi from "../../apis/stubhubSales.api";
import supabaseHttpClient from "../../clients/supabaseHttp.client";
import supabaseClient from "../../clients/supabase.client";
import moment from "moment";

// ─── Constants ────────────────────────────────────────────────────────────────

const SEATGEEK_LOGO = "/seatgeek-logo.ico";
const VIVID_LOGO = "/vivid-logo.ico";
const STUBHUB_LOGO = "/stubhub-logo.ico";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SalesRow {
  id: string;
  source: "SeatGeek" | "Vivid" | "StubHub";
  purchased_at: string;
  section_name: string;
  row_name: string;
  base_price: number;
  quantity: number;
  total_price: number;
}

export interface SalesTableProps {
  eventId: string;
  height?: number;
  onRefresh?: (refresh: () => void) => void;
  /**
   * Pre-resolved SeatGeek external event ID from the parent (e.g. TradeDetailPanel).
   * `null` = no mapping. `undefined` = not provided, resolve internally.
   */
  sgEventId?: string | null;
  /**
   * Pre-resolved StubHub external event ID from the parent.
   * `null` = no mapping. `undefined` = not provided, resolve internally.
   */
  stubhubEventId?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SalesTable - Reusable component for displaying combined SeatGeek + VividSeats sales data
 * 
 * Features:
 * - Fetches sales data from both SeatGeek and VividSeats
 * - Shows sales table with columns: source, purchased_at, section_name, row_name, base_price, quantity, total_price
 * - Uses useClientFilters for client-side filtering
 * - Exposes refresh handler
 */
const SalesTable: React.FC<SalesTableProps> = ({
  eventId,
  height = 220,
  sgEventId: sgEventIdProp,
  stubhubEventId: stubhubEventIdProp,
}) => {
  const [sales, setSales] = React.useState<any[]>([]);
  const [vividSales, setVividSales] = React.useState<any[]>([]);
  const [stubhubSales, setStubhubSales] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Fetch sales data
  const fetchSalesData = React.useCallback(() => {
    if (!eventId) return;
    setLoading(true);

    // Fetch VividSeats sales directly
    const vividPromise = vividSalesApi.fetchVividSales(eventId)
      .then((res) => setVividSales(res.data ?? []))
      .catch(() => { setVividSales([]) });

    // SeatGeek: use pre-resolved ID from props, or resolve via the seatgeekEvent endpoint
    const sgPromise = (() => {
      if (sgEventIdProp !== undefined) {
        // Prop provided: null = no mapping, skip; string = use directly
        if (!sgEventIdProp) return Promise.resolve();
        return salesApi.fetchSales(sgEventIdProp)
          .then((res) => setSales(res.data ?? []))
          .catch(() => { setSales([]); });
      }
      // Not provided: resolve internally
      return supabaseHttpClient
        .get(`/functions/v1/events-api/seatgeekEvent/${eventId}`)
        .then((mappingRes) => {
          const sgEventId = mappingRes.data?.data?.id;
          if (!sgEventId) return;
          return salesApi.fetchSales(String(sgEventId)).then((res) => setSales(res.data ?? []));
        })
        .catch(() => { setSales([]); });
    })();

    // StubHub: use pre-resolved ID from props, or resolve via Supabase mapping query
    const stubhubPromise = (() => {
      if (stubhubEventIdProp !== undefined) {
        // Prop provided: null = no mapping, skip; string = use directly
        if (!stubhubEventIdProp) return Promise.resolve();
        return stubhubSalesApi.fetchStubhubSales(stubhubEventIdProp)
          .then((res) => setStubhubSales(res.data ?? []))
          .catch(() => { setStubhubSales([]); });
      }
      // Not provided: resolve internally
      return Promise.resolve(
        supabaseClient
          .from("events_external_mapping")
          .select("external_event_id")
          .eq("event_id", eventId)
          .eq("external_platform", "stubhub")
          .maybeSingle()
      )
        .then(({ data: mapping }) => {
          if (!mapping?.external_event_id) return;
          return stubhubSalesApi.fetchStubhubSales(String(mapping.external_event_id))
            .then((res) => setStubhubSales(res.data ?? []));
        })
        .catch(() => { setStubhubSales([]);});
    })();

    Promise.all([vividPromise, sgPromise, stubhubPromise])
      .finally(() => setLoading(false));
  }, [eventId, sgEventIdProp, stubhubEventIdProp]);

  // Initial fetch
  React.useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  // Combined sales table data
  const combinedSalesTableData = React.useMemo(() => {
    const seatgeekData = (sales || []).map((sale: any) => {
      const totalPrice = sale.base_price * sale.quantity;
      return {
        id: `sg-${sale.id || Math.random()}`,
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
      const basePrice = sale.totalTickets > 0 ? sale.totalSalePrice / sale.totalTickets : 0;
      return {
        id: `vivid-${index}`,
        purchased_at: sale.saleDate,
        section_name: sale.sectionName || "-",
        row_name: "-",
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

  // Sales columns
  const salesColumns: CustomGridColDef[] = React.useMemo(() => [
    {
      field: "source",
      headerName: "Source",
      minWidth: 70,
      maxWidth: 70,
      flex: 0,
      type: "singleSelect",
      valueOptions: ["SeatGeek", "Vivid", "StubHub"],
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
              sx={{ width: 16, height: 16, objectFit: "contain" }}
            />
          </Tooltip>
        );
      },
    },
    {
      field: "purchased_at",
      headerName: "Sold Date",
      minWidth: 150,
      flex: 1,
      type: "dateTime",
      valueGetter: (value: any) => (value ? new Date(value) : null),
      valueFormatter: (value: any) => (value ? formatDateTime(value) : "-"),
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
      minWidth: 60,
      type: "string",
    },
    {
      field: "base_price",
      headerName: "Avg. Price",
      minWidth: 90,
      min: 0,
      flex: 1,
      max: 20000,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" && value >= 0 ? `$${value.toFixed(0)}` : "-",
    },
    {
      field: "quantity",
      headerName: "Qty",
      minWidth: 60,
      flex: 1,
      min: 0,
      max: 1000,
      type: "number",
    },
    {
      field: "total_price",
      headerName: "Total",
      minWidth: 90,
      flex: 1,
      min: 0,
      max: 500000,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" && value >= 0 ? `$${value.toFixed(0)}` : "-",
    },
  ], []);

  // Client-side filtering
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
    data: combinedSalesTableData,
    columns: salesColumns,
    initialPaginationModel: { page: 0, pageSize: 10 },
    initialSortModel: [{ field: "purchased_at", sort: "desc" }],
  });

  // onRefresh prop is unused — SalesTable exposes fetchSalesData directly via onRefresh on the grid below

  return (
    <Box sx={{ height: height, width: "100%" }}>
      <CustomDataGrid
        title="Sales Data"
        rows={paginatedRows}
        rowCount={totalFilteredRows}
        columns={salesColumns}
        isLoading={loading}
        error={null}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        sortingModel={sortModel}
        setSortingModel={setSortModel}
        filterModel={filterModel}
        setFilterModel={setFilterModel}
        defaultFilterType="header"
        onRefresh={fetchSalesData}
        height={height}
        paginationMode="server"
        sortingMode="client"
      />
    </Box>
  );
};

export default SalesTable;
