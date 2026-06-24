import * as React from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import MapIcon from "@mui/icons-material/Map";

import { useAppDispatch } from "../store/reducers/root.reducer";
import { getTrades } from "../store/slices/trades.slice";

import VenueMap from "../components/venue/VenueMap";
import ZoneLegend from "../components/venue/ZoneLegend";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import { useClientFilters } from "../hooks/useClientFilters";
import { useListingsMapState } from "../hooks/useListingsMapState";
import { usePurchaseModal } from "../components/common/PurchaseModal";
import { formatDateTime } from "../shared/utils/dateTime.util";
import { getListingColumns, getTradeColumns } from "./listingsMapView.columns";

export default function ListingsMapViewPage() {
  const dispatch = useAppDispatch();
  const { event_id } = useParams<{ event_id: string }>();
  const { openPurchaseModal } = usePurchaseModal();

  const {
    loading,
    error,
    tradesLoading,
    eventInfo,
    effectiveMap,
    filteredListings,
    filteredTrades,
    availableSectionIds,
    zoneOptions,
    selectedSections,
    highlightedGroup,
    handleSectionClick,
    handleGroupClick,
    handleRefresh,
    urlRowFilter,
  } = useListingsMapState();

  // ── Buy handler ─────────────────────────────────────────────────────────────
  const handleBuyClick = React.useCallback(
    (listing: any) => {
      openPurchaseModal(
        {
          id: listing.id || listing.listing_id,
          row: listing.row || "",
          section_name: listing.section_name || listing.vs_section || "",
          price: listing.price || listing.max_buy_price || 0,
          quantity: listing.quantity || 1,
          splits: listing.splits || (listing.quantity ? [listing.quantity] : [1]),
        },
        {
          id: eventInfo?.id || event_id || "",
          name: eventInfo?.name || "",
          utc_date: eventInfo?.utc_date,
          venue_id: eventInfo?.venue_id,
          venue_name: eventInfo?.venue_name,
          primary_performer_name: eventInfo?.primary_performer_name,
          local_date: eventInfo?.local_date,
          event_url: eventInfo?.web_path
            ? `https://www.vividseats.com${eventInfo.web_path}`
            : undefined,
        },
      );
    },
    [openPurchaseModal, eventInfo, event_id],
  );

  // ── Column definitions ──────────────────────────────────────────────────────
  const mapListingColumns = React.useMemo(
    () => getListingColumns(handleBuyClick),
    [zoneOptions, handleBuyClick],
  );
  const tradeColumns = React.useMemo(
    () => getTradeColumns(handleBuyClick),
    [handleBuyClick],
  );

  // ── Client-side filtering — listings ────────────────────────────────────────
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
    data: filteredListings,
    columns: mapListingColumns,
    initialPaginationModel: { page: 0, pageSize: 50 },
    initialSortModel: [{ field: "price", sort: "asc" }],
  });

  // ── Client-side filtering — trades ─────────────────────────────────────────
  const {
    paginationModel: tradesPaginationModel,
    sortModel: tradesSortModel,
    filterModel: tradesFilterModel,
    setPaginationModel: setTradesPaginationModel,
    setSortModel: setTradesSortModel,
    setFilterModel: setTradesFilterModel,
    paginatedRows: tradesPaginatedRows,
    totalFilteredRows: tradesTotalFilteredRows,
  } = useClientFilters({
    data: filteredTrades,
    columns: tradeColumns,
    initialPaginationModel: { page: 0, pageSize: 25 },
    initialSortModel: [{ field: "created_at", sort: "desc" }],
  });

  // ── Apply URL row filter on mount ──────────────────────────────────────────
  const urlRowApplied = React.useRef(false);
  React.useEffect(() => {
    if (urlRowFilter && !urlRowApplied.current) {
      urlRowApplied.current = true;
      setFilterModel((prev: any) => {
        const items = (prev?.items || []).filter((i: any) => i.field !== "row");
        items.push({ field: "row", operator: "contains", value: urlRowFilter });
        return { ...prev, items };
      });
      setTradesFilterModel((prev: any) => {
        const items = (prev?.items || []).filter((i: any) => i.field !== "row");
        items.push({ field: "row", operator: "contains", value: urlRowFilter });
        return { ...prev, items };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlRowFilter]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Stack padding={2} spacing={2} sx={{ height: "calc(100vh - 64px)", overflow: "hidden" }}>
      {/* Error banner (non-blocking) */}
      {error && (
        <Alert severity="error" sx={{ flexShrink: 0 }}>{error}</Alert>
      )}

      {/* Event Info Header */}
      {loading ? (
        <Card variant="outlined" sx={{ flexShrink: 0 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Divider sx={{ mb: 1, mt: 0.5 }} />
            <Stack direction="row" spacing={4}>
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={180} />
              <Skeleton variant="text" width={140} />
            </Stack>
          </CardContent>
        </Card>
      ) : eventInfo?.name ? (
        <Card variant="outlined" sx={{ flexShrink: 0 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {eventInfo.name}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Date & Time</Typography>
                <Typography variant="body2">
                  {eventInfo?.local_date ? formatDateTime(eventInfo.local_date) : ""}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Venue</Typography>
                <Typography variant="body2">
                  {`${eventInfo.venue_name || ""}, ${eventInfo?.venue_city || ""}, ${eventInfo?.venue_state || ""}`}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Performer</Typography>
                <Typography variant="body2">{eventInfo?.primary_performer_name}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                  <IconButton size="small" onClick={handleRefresh} title="Refresh">
                    <RefreshIcon />
                  </IconButton>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      {/* Main Content: Map + Listings */}
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        {/* Left: Venue Map */}
        <Grid size={{ xs: 12, md: 7, lg: 7 }} sx={{ height: "100%" }}>
          <Card
            variant="outlined"
            sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {loading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }} spacing={1}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary">Loading venue map...</Typography>
              </Stack>
            ) : effectiveMap ? (
              <>
                <Box sx={{ flexShrink: 0, maxHeight: 80, overflowY: "auto", overflowX: "hidden" }}>
                  <ZoneLegend
                    groups={effectiveMap.groups}
                    sections={effectiveMap.sections}
                    highlightedGroup={highlightedGroup}
                    onGroupClick={handleGroupClick}
                    availableSectionIds={availableSectionIds}
                  />
                </Box>
                <Divider sx={{ margin: 1 }} />
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <VenueMap
                    mapData={effectiveMap}
                    selectedSections={selectedSections}
                    onSectionClick={handleSectionClick}
                    highlightedGroup={highlightedGroup}
                    availableSectionIds={availableSectionIds}
                  />
                </Box>
              </>
            ) : (
              <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }} spacing={1}>
                <MapIcon sx={{ fontSize: 64, color: "text.disabled" }} />
                <Typography color="text.secondary">No venue map available for this event</Typography>
              </Stack>
            )}
          </Card>
        </Grid>

        {/* Right: Listings + Recommendations */}
        <Grid size={{ xs: 12, md: 5, lg: 5 }} sx={{ height: "100%" }}>
          <Stack spacing={1} sx={{ height: "100%" }}>
            {/* Listings */}
            <Paper
              variant="outlined"
              sx={{ height: "50%", borderRadius: 1, overflow: "hidden", padding: 2, display: "flex", flexDirection: "column" }}
            >
              <CustomDataGrid
                title="Listings"
                rows={paginatedRows}
                rowCount={totalFilteredRows}
                isLoading={loading}
                error={null}
                columns={mapListingColumns}
                paginationModel={paginationModel}
                setPaginationModel={setPaginationModel}
                sortingModel={sortModel}
                setSortingModel={setSortModel}
                filterModel={filterModel}
                setFilterModel={setFilterModel}
                onRefresh={handleRefresh}
                defaultFilterType="header"
                isFullHeight
              />
            </Paper>

            {/* Recommendations */}
            <Paper
              variant="outlined"
              sx={{ height: "50%", borderRadius: 1, overflow: "hidden", padding: 2, display: "flex", flexDirection: "column" }}
            >
              <CustomDataGrid
                title="Recommendations"
                rows={tradesPaginatedRows}
                rowCount={tradesTotalFilteredRows}
                isLoading={tradesLoading}
                error={null}
                columns={tradeColumns}
                paginationModel={tradesPaginationModel}
                setPaginationModel={setTradesPaginationModel}
                sortingModel={tradesSortModel}
                setSortingModel={setTradesSortModel}
                filterModel={tradesFilterModel}
                setFilterModel={setTradesFilterModel}
                defaultFilterType="header"
                onRefresh={() => {
                  if (event_id) {
                    dispatch(
                      getTrades({
                        page: 0,
                        pageSize: 50,
                        filters: {
                          items: [{ field: "event_id", operator: "equals", value: event_id }],
                        },
                        sortFields: [{ field: "created_at", sort: "desc" }],
                      }),
                    );
                  }
                }}
                isFullHeight
                paginationMode="client"
                sortingMode="client"
              />
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
