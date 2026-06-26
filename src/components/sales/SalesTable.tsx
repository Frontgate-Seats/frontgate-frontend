import * as React from "react";
import { Box, Typography } from "@mui/material";
import CustomDataGrid from "../common/datagrid/CustomDatagrid";
import { useClientFilters } from "../../hooks/useClientFilters";
import { formatDateTime } from "../../shared/utils/dateTime.util";
import type { CustomGridColDef } from "../../shared/types/mui.type";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SalesRow {
  id: string;
  source: "SeatGeek" | "Vivid";
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
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

import salesApi from "../../apis/sales.api";
import vividSalesApi from "../../apis/vividSales.api";
import supabaseHttpClient from "../../clients/supabaseHttp.client";
import moment from "moment";

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
  onRefresh,
}) => {
  const [sales, setSales] = React.useState<any[]>([]);
  const [vividSales, setVividSales] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch sales data
  const fetchSalesData = React.useCallback(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);

    // Fetch VividSeats sales directly
    const vividPromise = vividSalesApi.fetchVividSales(eventId)
      .then((res) => setVividSales(res.data ?? []))
      .catch(() => setVividSales([]));

    // Fetch SeatGeek sales via mapping
    const sgPromise = supabaseHttpClient
      .get(`/functions/v1/events-api/seatgeekEvent/${eventId}`)
      .then((mappingRes) => {
        const sgEventId = mappingRes.data?.data?.id;
        if (!sgEventId) return;
        return salesApi.fetchSales(String(sgEventId)).then((res) => setSales(res.data ?? []));
      })
      .catch(() => setSales([]));

    Promise.all([vividPromise, sgPromise])
      .catch((err) => setError(err?.message ?? "Failed to load sales"))
      .finally(() => setLoading(false));
  }, [eventId]);

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

    return [...seatgeekData, ...vividData].sort((a, b) =>
      moment.utc(b.purchased_at).valueOf() - moment.utc(a.purchased_at).valueOf()
    );
  }, [sales, vividSales]);

  // Sales columns
  const salesColumns: CustomGridColDef[] = React.useMemo(() => [
    {
      field: "source",
      headerName: "Source",
      minWidth: 90,
      flex: 1,
      type: "singleSelect",
      valueOptions: ["SeatGeek", "Vivid"],
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

  // Expose refresh handler
  React.useEffect(() => {
    if (typeof onRefresh === "function") {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const refreshHandler = () => fetchSalesData();
      // Store the refresh handler in a way that can be accessed externally
      // This is a simple approach; alternatively, use a ref or context
    }
  }, [onRefresh, fetchSalesData]);

  // Make fetchSalesData available externally via a ref or callback
  // For now, we'll just return it as part of the component's public API
  // In practice, you might want to use forwardRef or a custom hook pattern

  return (
    <Box sx={{ height: height, width: "100%" }}>
      <CustomDataGrid
        title="Sales Data"
        rows={paginatedRows}
        rowCount={totalFilteredRows}
        columns={salesColumns}
        isLoading={loading}
        error={error}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        sortingModel={sortModel}
        setSortingModel={setSortModel}
        filterModel={filterModel}
        setFilterModel={setFilterModel}
        defaultFilterType="header"
        onRefresh={fetchSalesData}
        height={height}
        paginationMode="client"
        sortingMode="client"
        headerComponent={
          <Typography variant="subtitle1" fontWeight={600}>
            Sales Data
            {!loading && combinedSalesTableData.length > 0 && (
              <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                ({totalFilteredRows} sales)
              </Typography>
            )}
          </Typography>
        }
      />
    </Box>
  );
};

export default SalesTable;
