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
  FormControlLabel,
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useParams } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import MapIcon from "@mui/icons-material/Map";

import VenueMap from "../components/venue/VenueMap";
import ZoneLegend from "../components/venue/ZoneLegend";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import { useClientFilters } from "../hooks/useClientFilters";
import { useListingsMapState } from "../hooks/useListingsMapState";
import { usePurchaseModal } from "../components/common/PurchaseModal";
import { formatDateTime } from "../shared/utils/dateTime.util";
import { getListingColumns, getTradeColumns, getMergedColumns } from "./listingsMapView.columns";
import type { Trade } from "../shared/types/trade.types";
import moment from "moment";

// ── Filter state for merged view ─────────────────────────────────────────────
interface FilterState {
  showRecommendedOnly: boolean;
  daysRange: [number, number]; // [minDays, maxDays]
  recommendationTime: "all" | "today" | "thisWeek";
}

export default function ListingsMapViewPage() {
  const { event_id } = useParams<{ event_id: string }>();
  const { openPurchaseModal } = usePurchaseModal();

  // ── Filter state ───────────────────────────────────────────────────────────
  const [filters, setFilters] = React.useState<FilterState>({
    showRecommendedOnly: false,
    daysRange: [7, 30],
    recommendationTime: "all",
  });

  const {
    loading,
    error,
    tradesLoading,
    eventInfo,
    effectiveMap,
    filteredListings,
    filteredTrades,
    allTrades,
    availableSectionIds,
    zoneOptions,
    selectedSections,
    selectedSectionIds,
    highlightedGroup,
    setSelectedSections,
    setSelectedSectionIds,
    setHighlightedGroup,
    handleSectionClick,
    handleGroupClick,
    handleRefresh,
    urlRowFilter,
  } = useListingsMapState();

  // ── Buy handler ─────────────────────────────────────────────────────────────
  const handleBuyClick = React.useCallback(
    (listing: any) => {
      // For recommendation rows, use the trade's listing_id
      const listingId = listing.listingId || listing._trade?.listing_id || listing.id;
      openPurchaseModal(
        {
          id: listingId,
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

  // ── Filter handlers ─────────────────────────────────────────────────────────
  const handleShowRecommendedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const showOnly = event.target.checked;
    setFilters((prev) => ({ ...prev, showRecommendedOnly: showOnly }));
    
    // When checkbox is checked, clear existing selections and highlight recommended sections on the map
    if (showOnly && effectiveMap) {
      const recSectionNames = new Set<string>();
      allTrades.forEach((t: Trade) => {
        if (t.vs_section) {
          recSectionNames.add(t.vs_section.toLowerCase());
        }
      });
      
      // Clear any existing manual section selections first
      setSelectedSections(new Set());
      
      // Find section IDs that match recommended sections
      const sectionIds = new Set<number>();
      effectiveMap.sections.forEach((s) => {
        if (recSectionNames.has(s.name.toLowerCase())) {
          sectionIds.add(s.id);
        }
      });
      
      // Also find group IDs for those sections
      const groupIds = new Set<number>();
      effectiveMap.sections.forEach((s) => {
        if (recSectionNames.has(s.name.toLowerCase()) && s.groupId != null) {
          groupIds.add(s.groupId);
        }
      });
      
      setSelectedSectionIds(sectionIds);
      setHighlightedGroup(groupIds);
    } else if (!showOnly) {
      // Clear all selections when unchecked
      setSelectedSections(new Set());
      setSelectedSectionIds(new Set());
      setHighlightedGroup(new Set());
    }
  };

  const handleDaysRangeChange = (_event: React.MouseEvent<HTMLElement>, newRange: string | null) => {
    if (newRange) {
      const [min, max] = newRange.split("-").map(Number);
      setFilters((prev) => ({ ...prev, daysRange: [min, max] as [number, number] }));
    }
  };

  const handleRecommendationTimeChange = (_event: React.MouseEvent<HTMLElement>, newTime: "all" | "today" | "thisWeek" | null) => {
    if (newTime) {
      setFilters((prev) => ({ ...prev, recommendationTime: newTime }));
    }
  };

  // ── Filter trades by recommendation time ─────────────────────────────────
  const filteredTradesByTime = React.useMemo(() => {
    let result = filteredTrades;
    
    // Filter by recommendation time
    if (filters.recommendationTime === "today") {
      const todayStart = moment().startOf("day");
      result = result.filter((t: Trade) => {
        if (!t.created_at) return false;
        return moment(t.created_at).isAfter(todayStart);
      });
    } else if (filters.recommendationTime === "thisWeek") {
      const weekStart = moment().startOf("week");
      result = result.filter((t: Trade) => {
        if (!t.created_at) return false;
        return moment(t.created_at).isAfter(weekStart);
      });
    }

    return result;
  }, [filteredTrades, filters.recommendationTime]);

  // ── Get recommended section names ──────────────────────────────────────────
  const recommendedSections = React.useMemo(() => {
    const sections = new Set<string>();
    filteredTrades.forEach((t: Trade) => {
      if (t.vs_section) {
        sections.add(t.vs_section.toLowerCase());
      }
    });
    return sections;
  }, [filteredTrades]);

  // ── Merge listings and trades into unified view ───────────────────────────
  const mergedRows = React.useMemo(() => {
    // Build set of currently available listing IDs from enrichedListings (unfiltered by map)
    const availableListingIds = new Set<string>();
    filteredListings.forEach((l: any) => {
      if (l.id) availableListingIds.add(String(l.id));
    });

    // Get sections that have recommendations
    const recSections = new Set<string>();
    filteredTradesByTime.forEach((t: Trade) => {
      if (t.vs_section) {
        recSections.add(t.vs_section.toLowerCase());
      }
    });

    // Convert trades to listing-like format
    const tradeRows = filteredTradesByTime.map((t: Trade) => {
      const isAvailable = !!(t.listing_id && availableListingIds.has(t.listing_id));
      return {
        id: `trade-${t.id}`,
        listingId: t.listing_id || "",
        section_name: t.vs_section || "—",
        row: t.row || "—",
        quantity: t.quantity || 1,
        price: t.max_buy_price || 0,
        isRecommendation: true,
        isInRecommendedSection: true,
        isListingAvailable: isAvailable,
        projected_sell_price: t.projected_sell_price,
        confidence_level: t.confidence_level,
        recommendation_date: t.created_at,
        estimated_margin_percent: t.estimated_margin_percent,
        // Keep trade-specific fields
        _trade: t,
      };
    });

    // Add non-recommended listings
    const listingRows = filteredListings
      .map((l: any) => ({
        ...l,
        isRecommendation: false,
        isInRecommendedSection: recSections.has((l.section_name || "").toLowerCase()),
        isListingAvailable: true,
        _trade: null,
      }));

    // Combine and sort by price (natural Vivid Seats order)
    const combined = [...tradeRows, ...listingRows];
    
    // If show recommended only, filter to show only sections WITH recommendations
    // (but still show all listings in those sections)
    if (filters.showRecommendedOnly) {
      return combined.filter((r) => 
        r.isRecommendation || r.isInRecommendedSection || recSections.has((r.section_name || "").toLowerCase())
      );
    }

    return combined;
  }, [filteredListings, filteredTradesByTime, filters.showRecommendedOnly]);

  // ── Column definitions ──────────────────────────────────────────────────────
  const mapListingColumns = React.useMemo(
    () => getListingColumns(handleBuyClick),
    [zoneOptions, handleBuyClick],
  );
  const tradeColumns = React.useMemo(
    () => getTradeColumns(handleBuyClick),
    [handleBuyClick],
  );
  const mergedColumns = React.useMemo(
    () => getMergedColumns(handleBuyClick),
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

  // ── Client-side filtering — trades (kept for URL row filter functionality) ──
  const {
    setFilterModel: setTradesFilterModel,
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
      setFilterModel((prev) => {
        const items = (prev?.items || []).filter((i) => i.field !== "row");
        items.push({ field: "row", operator: "contains", value: urlRowFilter });
        return { ...prev, items };
      });
      setTradesFilterModel((prev) => {
        const items = (prev?.items || []).filter((i) => i.field !== "row");
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
        <Grid size={{ xs: 12, lg: 5 }} sx={{ height: "100%" }}>
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
        <Grid size={{ xs: 12, lg: 7 }} sx={{ height: "100%" }}>
          {/* Filter Controls - above the chart */}
    
          <Stack spacing={1} sx={{ height: "100%" }}>
              <Box sx={{ mb: 1.5 }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filters.showRecommendedOnly}
                        onChange={handleShowRecommendedChange}
                        size="small"
                        color="success"
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight={500}>
                        Show Recommended Sections
                      </Typography>
                    }
                  />
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                  <ToggleButtonGroup
                    value={filters.recommendationTime}
                    exclusive
                    onChange={handleRecommendationTimeChange}
                    size="small"
                    sx={{
                      "& .MuiToggleButton-root": {
                        px: 1.5,
                        py: 0.5,
                        fontSize: "0.75rem",
                        textTransform: "none",
                      },
                    }}
                  >
                    <ToggleButton value="today">Today</ToggleButton>
                    <ToggleButton value="thisWeek">This Week</ToggleButton>
                    <ToggleButton value="all">All</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
              </Box>
            {/* Unified Table: Listings + Recommendations merged */}
            <Paper
              variant="outlined"
              sx={{ height: "100%", borderRadius: 1, overflow: "hidden", padding: 2, display: "flex", flexDirection: "column" }}
            >
              <CustomDataGrid
                title={filters.showRecommendedOnly ? "Recommended Sections" : "Listings & Recommendations"}
                rows={mergedRows}
                rowCount={mergedRows.length}
                isLoading={loading || tradesLoading}
                error={null}
                columns={mergedColumns}
                paginationModel={paginationModel}
                setPaginationModel={setPaginationModel}
                sortingModel={sortModel}
                setSortingModel={setSortModel}
                filterModel={filterModel}
                setFilterModel={setFilterModel}
                onRefresh={handleRefresh}
                isFullHeight
                paginationMode="client"
                sortingMode="client"
                defaultFilterType="header"
                getRowClassName={(params: unknown) => {
                  const row = (params as { row?: { isRecommendation?: boolean; isListingAvailable?: boolean } })?.row;
                  if (row?.isRecommendation && row?.isListingAvailable === false) {
                    return "recommendation-row-unavailable";
                  }
                  if (row?.isRecommendation && row?.isListingAvailable) {
                    return "recommendation-row-available";
                  }
                  return "";
                }}
                headerComponent={
                  <Typography variant="subtitle1" fontWeight={600}>
                    {filters.showRecommendedOnly ? "Recommended Sections" : "Listings & Recommendations"}
                    <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                      ({mergedRows.length} total
                      {filteredTrades.length > 0 ? `, ${filteredTrades.length} recommendations` : ""})
                    </Typography>
                  </Typography>
                }
              />
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
