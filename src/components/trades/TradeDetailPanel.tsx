import * as React from "react";
import { Box, Typography, Alert, Stack, Tooltip, Button } from "@mui/material";
import listingsApi from "../../apis/listings.api";
import CustomDataGrid from "../common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../../shared/types/mui.type";
import type { Trade } from "../../shared/types/trade.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListingRow {
  id: string;
  listingId: string;
  section_name: string;
  row: string;
  quantity: number | string;
  price: number | null;
}

export interface ListingsCacheEntry {
  data: ListingRow[];
  loading: boolean;
  error: string | null;
}

export type ListingsCache = Record<string, ListingsCacheEntry>;

export interface TradeDetailPanelProps {
  trade: Trade;
  listingsCache: React.RefObject<ListingsCache>;
  onCacheUpdate: (eventId: string, entry: ListingsCacheEntry) => void;
  onBuyClick?: (listing: { id: string; row: string; section_name: string; price: number; quantity: number; splits?: number[] }) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseListings(data: any[]): ListingRow[] {
  return data.map((l: any) => {
    // API response shape: { id: "VB...", row, section: { name }, quantity, pricePerTicket, ... }
    // The api already adds section_name: d.section.name via the spread
    const listingId = l.id ?? "";
    return {
      id: listingId,
      listingId,
      section_name: l.section_name ?? l.section?.name ?? "—",
      row: l.row ?? "—",
      quantity: l.quantity ?? l.availableQuantity ?? "—",
      price: l.pricePerTicket ?? l.price ?? l.listPrice ?? null,
    };
  });
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function buildColumns(onBuyClick?: (listing: any) => void): CustomGridColDef[] {
  return [
    // Listing ID first — always shown, used as the buy link target
    {
      field: "listingId",
      headerName: "Listing ID",
      width: 180,
      type: "string",
      renderCell: (params) => (
        <Tooltip title={params.value ?? ""} placement="top">
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontFamily: "monospace",
              fontSize: "0.75rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
            }}
          >
            {params.value || "—"}
          </Typography>
        </Tooltip>
      ),
    },
    { field: "section_name", headerName: "Section", flex: 1, minWidth: 140, type: "string" },
    { field: "row", headerName: "Row", width: 80, type: "string" },
    {
      field: "quantity",
      headerName: "Qty",
      width: 65,
      align: "center",
      headerAlign: "center",
      type: "number",
      min: 0,
      max: 20,
    },
    {
      field: "price",
      headerName: "Price",
      width: 130,
      align: "right",
      headerAlign: "right",
      type: "number",
      min: 0,
      max: 10000,
      renderCell: (params) => (
        <Typography fontWeight={600} color="text.primary" variant="body2">
          {params.value != null ? `$${Number(params.value).toFixed(2)}` : "—"}
        </Typography>
      ),
    },
    // Buy button — opens purchase modal
    {
      field: "__trade",
      headerName: "",
      width: 150,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const listingId = params.row.listingId;
        if (!listingId) return null;
        return (
          <Button
            variant="contained"
            size="small"
            onClick={(e: any) => {
              e.stopPropagation();
              if (onBuyClick) {
                onBuyClick({
                  id: listingId,
                  row: params.row.row || "",
                  section_name: params.row.section_name || "",
                  price: params.row.price || 0,
                  quantity: typeof params.row.quantity === "number" ? params.row.quantity : 1,
                });
              }
            }}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Buy
          </Button>
        );
      },
    },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TradeDetailPanel({
  trade,
  listingsCache,
  onCacheUpdate,
  onBuyClick,
}: TradeDetailPanelProps) {
  const eventId = trade.event_id ? String(trade.event_id) : null;

  const cached = eventId ? listingsCache.current?.[eventId] : null;
  const [listings, setListings] = React.useState<ListingRow[]>(cached?.data ?? []);
  const [loading, setLoading] = React.useState(cached ? false : !!eventId);
  const [fetchError, setFetchError] = React.useState<string | null>(cached?.error ?? null);
  const [filterModel, setFilterModel] = React.useState<any>({ items: [] });
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 25 });

  const fetchListings = React.useCallback(
    (force = false) => {
      if (!eventId) return;
      if (!force && listingsCache.current?.[eventId]?.data.length) return;

      setLoading(true);
      setFetchError(null);
      onCacheUpdate(eventId, { data: [], loading: true, error: null });

      listingsApi
        .fetchListings(eventId)
        .then((res) => {
          const normalised = normaliseListings(res.data ?? []);
          setListings(normalised);
          setFetchError(null);
          onCacheUpdate(eventId, { data: normalised, loading: false, error: null });
        })
        .catch((err) => {
          const msg = err?.message ?? "Failed to load listings";
          setFetchError(msg);
          onCacheUpdate(eventId, { data: [], loading: false, error: msg });
        })
        .finally(() => setLoading(false));
    },
    [eventId, listingsCache, onCacheUpdate],
  );

  React.useEffect(() => {
    fetchListings(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredListings = React.useMemo(() => {
    if (!filterModel.items?.length) return listings;
    return listings.filter((row) =>
      filterModel.items.every(({ field, operator, value }: any) => {
        if (value == null || value === "") return true;
        const cell = (row as any)[field];
        switch (operator) {
          case "contains":
            return String(cell ?? "").toLowerCase().includes(String(value).toLowerCase());
          case "equals":
            return cell == value;
          case ">=":
          case "greaterThanOrEqual":
            return cell != null && Number(cell) >= Number(value);
          case "<=":
          case "lessThanOrEqual":
            return cell != null && Number(cell) <= Number(value);
          default:
            return true;
        }
      }),
    );
  }, [listings, filterModel]);

  const columns = React.useMemo(
    () => (eventId ? buildColumns(onBuyClick) : []),
    [eventId, onBuyClick],
  );

  return (
    <Box
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      onKeyPress={(e) => e.stopPropagation()}
      sx={{
        width: "100%",
        px: 3,
        py: 2,
        bgcolor: "background.default",
        borderTop: "2px solid",
        borderColor: "primary.main",
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={2.5}>
        {fetchError && <Alert severity="error">{fetchError}</Alert>}

        {/* ── Listings via CustomDataGrid — only when event_id exists ── */}
        {eventId && (
          <CustomDataGrid
            title="Available Listings for This Event"
            rows={filteredListings}
            rowCount={filteredListings.length}
            columns={columns}
            isLoading={loading}
            error={null}
            onRefresh={() => fetchListings(true)}
            filterModel={filterModel}
            setFilterModel={setFilterModel}
            paginationMode="client"
            sortingMode="client"
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            defaultFilterType="header"
            height={560}
            headerComponent={
              <Typography variant="subtitle1" fontWeight={600}>
                Available Listings for This Event
                {!loading && listings.length > 0 && (
                  <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                    ({filteredListings.length}
                    {filterModel.items.length > 0 ? ` of ${listings.length}` : ""})
                  </Typography>
                )}
              </Typography>
            }
          />
        )}
      </Stack>
    </Box>
  );
}
