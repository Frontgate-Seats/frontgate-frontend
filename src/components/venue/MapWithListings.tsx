import * as React from "react";
import {
  Box,
  Typography,
  Card,
  CircularProgress,
  Paper,
  Stack,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";

import listingsApi from "../../apis/listings.api";
import ToggleFullscreen from "../common/ToggleFullscreen";
import CustomDataGrid from "../common/datagrid/CustomDatagrid";
import VenueMap from "./VenueMap";
import ZoneLegend from "./ZoneLegend";
import { useClientFilters } from "../../hooks/useClientFilters";
import type { VenueMapData } from "../../store/slices/listingsMapView.slice";
import { getMergedColumns } from "../../pages/listingsMapView.columns";
import type { Trade } from "../../shared/types/trade.types";
import supabaseClient from "../../clients/supabase.client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MapWithListingsProps {
  event_id: string;
  trade?: Trade | null;
  onBuyClick?: (listing: { id: string; row: string; section_name: string; price: number; quantity: number; splits?: number[] }) => void;
  height?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * MapWithListings - Reusable component that renders VenueMap on left
 * and merged CustomDataGrid on right (listings + recommendations)
 */
const MapWithListings: React.FC<MapWithListingsProps> = ({
  event_id,
  trade,
  onBuyClick,
  height = 450,
}) => {
  const [listings, setListings] = React.useState<any[]>([]);
  const [mapData, setMapData] = React.useState<VenueMapData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // All recommendations for this event (not just the expanded trade)
  const [allTrades, setAllTrades] = React.useState<Trade[]>([]);

  const [selectedSections, setSelectedSections] = React.useState<Set<string>>(new Set());
  const [selectedSectionIds, setSelectedSectionIds] = React.useState<Set<number>>(new Set());
  const [highlightedGroup, setHighlightedGroup] = React.useState<Set<number>>(new Set());

  const [showRecommendedOnly, setShowRecommendedOnly] = React.useState(true);
  const [recommendationTime, setRecommendationTime] = React.useState<"all" | "today" | "thisWeek">("all");

  const fetchListingsWithMap = React.useCallback(() => {
    if (!event_id) return;
    setLoading(true);
    setError(null);

    const listingsPromise = listingsApi
      .fetchListingsWithMap(event_id)
      .then((res) => {
        setListings(res.listings ?? []);
        setMapData(res.map ?? null);
      });

    const tradesPromise = supabaseClient
      .from("event_buy_listings_logs")
      .select(`
        id, event_id, listing_id, vs_section, row, quantity,
        max_buy_price, projected_sell_price, estimated_margin_percent,
        confidence_level, created_at,
        llm_result_comment,
        event_analysis_logs!inner (event_name, venue_name, primary_performer_name, llm_result),
        events (web_path, local_date)
      `)
      .eq("event_id", event_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const flat = (data ?? []).map((r: any) => ({
          ...r,
          event_name: r.event_analysis_logs?.event_name ?? "-",
          venue_name: r.event_analysis_logs?.venue_name ?? "-",
          primary_performer_name: r.event_analysis_logs?.primary_performer_name ?? "-",
          llm_result: r.event_analysis_logs?.llm_result ?? null,
          vs_web_path: r.events?.web_path ?? null,
          local_date: r.events?.local_date ?? null,
          sell_source: null,
          buy_source: null,
          llm_matched_section: null,
        }));
        setAllTrades(flat as Trade[]);
      });

    Promise.all([listingsPromise, tradesPromise])
      .catch((err) => setError(err?.message ?? "Failed to load listings"))
      .finally(() => setLoading(false));
  }, [event_id]);

  React.useEffect(() => {
    fetchListingsWithMap();
  }, [fetchListingsWithMap]);

  // Pre-select all recommendation sections once map data is loaded
  React.useEffect(() => {
    if (!mapData || allTrades.length === 0) return;
    handleShowRecommendedChange(true);
  }, [mapData, allTrades.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const sectionToZone = React.useMemo(() => {
    const lookup: Record<number, string> = {};
    if (!mapData) return lookup;
    const groupMap: Record<number, string> = {};
    mapData.groups.forEach((g) => { groupMap[g.id] = g.name; });
    mapData.sections.forEach((s) => {
      if (s.groupId != null && groupMap[s.groupId]) {
        lookup[s.id] = groupMap[s.groupId];
      }
    });
    return lookup;
  }, [mapData]);

  const enrichedListings = React.useMemo(() => {
    return listings.map((l: any) => ({
      ...l,
      zone_name: sectionToZone[l.section?.id] || "—",
      section_name: l.section_name ?? l.section?.name ?? "—",
    }));
  }, [listings, sectionToZone]);

  const availableSectionIds = React.useMemo(() => {
    const set = new Set<number>();
    listings.forEach((l: any) => {
      if (l.section?.id) set.add(l.section.id);
    });
    return set;
  }, [listings]);

  const filteredListings = React.useMemo(() => {
    let result = enrichedListings;
    if (selectedSectionIds.size > 0) {
      result = result.filter((l: any) => selectedSectionIds.has(l.section?.id));
    } else if (highlightedGroup.size > 0 && mapData) {
      const groupSectionIds = new Set(
        mapData.sections
          .filter((s) => s.groupId != null && highlightedGroup.has(s.groupId!))
          .map((s) => s.id),
      );
      result = result.filter((l: any) => groupSectionIds.has(l.section?.id));
    }
    return result;
  }, [enrichedListings, selectedSectionIds, highlightedGroup, mapData]);

  const mergedRows = React.useMemo(() => {
    const availableListingIds = new Set<string>();
    filteredListings.forEach((l: any) => {
      if (l.id) availableListingIds.add(String(l.id));
    });

    // All recommendations for this event as pinned rows at the top
    const tradeRows = allTrades.map((t) => ({
      id: `trade-${t.id}`,
      listingId: t.listing_id || "",
      section_name: t.vs_section || "—",
      row: t.row || "—",
      quantity: t.quantity || 1,
      price: t.max_buy_price || 0,
      isRecommendation: true,
      isInRecommendedSection: true,
      isListingAvailable: t.listing_id ? availableListingIds.has(t.listing_id) : false,
      projected_sell_price: t.projected_sell_price,
      confidence_level: t.confidence_level,
      recommendation_date: t.created_at,
      estimated_margin_percent: t.estimated_margin_percent,
      _trade: t,
      // highlight the currently expanded trade
      _isCurrentTrade: t.id === trade?.id,
    }));

    const recSections = new Set(allTrades.map((t) => (t.vs_section || "").toLowerCase()).filter(Boolean));
    const listingRows = filteredListings.map((l: any) => ({
      ...l,
      listingId: l.listingId || l.id || "",
      price: l.pricePerTicket ?? l.price ?? l.listPrice ?? null,
      isRecommendation: false,
      isInRecommendedSection: recSections.size > 0
        ? recSections.has((l.section_name || l.section?.name || "").toLowerCase())
        : false,
      isListingAvailable: true,
      _trade: null,
    }));

    return [...tradeRows, ...listingRows];
  }, [filteredListings, allTrades, trade?.id]);

  // Use listingId as the real VS listing ID — if missing, button shouldn't be shown
  const handleBuyClick = React.useCallback((row: any) => {
    if (!onBuyClick || !row.listingId) return;
    onBuyClick({ ...row, id: row.listingId, quantity: Number(row.quantity) });
  }, [onBuyClick]);

  const mergedColumns = React.useMemo(() => getMergedColumns(handleBuyClick), [handleBuyClick]);

  const filteredRowsByTime = React.useMemo(() => {
    if (recommendationTime === "all") return mergedRows;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return mergedRows.filter((row) => {
      // Always keep listing rows
      if (!row.isRecommendation) return true;
      if (!row.recommendation_date) return false;
      const recDate = new Date(row.recommendation_date);
      if (recommendationTime === "today") return recDate >= todayStart;
      if (recommendationTime === "thisWeek") return recDate >= weekStart;
      return true;
    });
  }, [mergedRows, recommendationTime]);

  const activeRows = showRecommendedOnly && allTrades.length > 0 ? filteredRowsByTime : mergedRows;

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
    data: activeRows,
    columns: mergedColumns,
    initialPaginationModel: { page: 0, pageSize: 50 },
    initialSortModel: [{ field: "price", sort: "asc" }],
  });

  const handleSectionClick = React.useCallback((sectionName: string, sectionId: number) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      const key = sectionName.toLowerCase();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSelectedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
    setHighlightedGroup(new Set());
  }, []);

  const handleGroupClick = React.useCallback((groupId: number | null) => {
    setHighlightedGroup((prev) => {
      if (groupId == null) return new Set();
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
    setSelectedSections(new Set());
    setSelectedSectionIds(new Set());
  }, []);

  const handleShowRecommendedChange = React.useCallback((checked: boolean) => {
    setShowRecommendedOnly(checked);
    if (checked && mapData && allTrades.length > 0) {
      // Collect all unique sections across all recommendations
      const recSectionNames = new Set(
        allTrades.map((t) => (t.vs_section || "").toLowerCase()).filter(Boolean)
      );
      setSelectedSections(new Set());
      const sectionIds = new Set<number>();
      const groupIds = new Set<number>();
      mapData.sections.forEach((s) => {
        if (recSectionNames.has(s.name.toLowerCase())) {
          sectionIds.add(s.id);
          if (s.groupId != null) groupIds.add(s.groupId);
        }
      });
      setSelectedSectionIds(sectionIds);
      setHighlightedGroup(groupIds);
    } else if (!checked) {
      setSelectedSections(new Set());
      setSelectedSectionIds(new Set());
      setHighlightedGroup(new Set());
    }
  }, [mapData, allTrades]);

  return (
    <Box sx={{ height: height, width: "100%" }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Stack spacing={2} sx={{ height: "100%" }}>
        <Box sx={{ mb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControlLabel
              control={
                <Checkbox
                  checked={showRecommendedOnly}
                  onChange={(e) => handleShowRecommendedChange(e.target.checked)}
                  disabled={allTrades.length === 0}
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
              value={recommendationTime}
              exclusive
              onChange={(_e, newTime) => {
                if (newTime) setRecommendationTime(newTime as any);
              }}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  px: 1.5,
                  py: 0.5,
                  fontSize: "0.75rem",
                  textTransform: "none",
                },
              }}
              disabled={allTrades.length === 0}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="today">Today</ToggleButton>
              <ToggleButton value="thisWeek">This Week</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ ml: "auto" }}>
              <Typography variant="caption" color="text.secondary">
                {allTrades.length > 0
                  ? `${allTrades.length} recommendation${allTrades.length > 1 ? "s" : ""} · ${[...new Set(allTrades.map(t => t.vs_section).filter(Boolean))].join(", ")}`
                  : "No recommendations"}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ display: "flex", maxHeight: height - 80, minHeight: 0 }}>
          <Box sx={{ flex: "0 0 35%", maxHeight: "100%" }}>
            <ToggleFullscreen fillHeight>
              <Card
                variant="outlined"
                sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
              >
              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }} spacing={1}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" color="text.secondary">Loading venue map...</Typography>
                </Stack>
              ) : mapData ? (
                <>
                  <Box sx={{ flexShrink: 0, maxHeight: 60, overflowY: "auto", overflowX: "hidden" }}>
                    <ZoneLegend
                      groups={mapData.groups}
                      sections={mapData.sections}
                      highlightedGroup={highlightedGroup}
                      onGroupClick={handleGroupClick}
                      availableSectionIds={availableSectionIds}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minHeight: 0 }}>
                    <VenueMap
                      mapData={mapData}
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
                  <Typography color="text.secondary">No venue map available</Typography>
                </Stack>
              )}
            </Card>
            </ToggleFullscreen>
          </Box>

          <Box sx={{ flex: 1, maxHeight: "100%", ml: 2 }}>
            <Paper
              variant="outlined"
              sx={{ height: "100%", borderRadius: 1, overflow: "hidden", padding: 1.5, display: "flex", flexDirection: "column" }}
            >
              <CustomDataGrid
                title={showRecommendedOnly && allTrades.length > 0 ? "Recommended Sections" : "Listings & Recommendations"}
                rows={paginatedRows}
                rowCount={totalFilteredRows}
                isLoading={loading}
                error={null}
                columns={mergedColumns}
                paginationModel={paginationModel}
                setPaginationModel={setPaginationModel}
                sortingModel={sortModel}
                setSortingModel={setSortModel}
                filterModel={filterModel}
                setFilterModel={setFilterModel}
                onRefresh={fetchListingsWithMap}
                isFullHeight
                paginationMode="server"
                sortingMode="client"
                defaultFilterType="header"
                getRowClassName={(params: unknown) => {
                  const row = (params as { row?: any })?.row;
                  if (!row) return "";
                  if (row.isRecommendation) {
                    // Current trade gets a stronger highlight
                    if (row._isCurrentTrade) return "recommendation-row-current";
                    if (row.isListingAvailable === false) return "recommendation-row-unavailable";
                    return "recommendation-row-available";
                  }
                  return "";
                }}
                headerComponent={
                  <Typography variant="subtitle1" fontWeight={600}>
                    {showRecommendedOnly && allTrades.length > 0 ? "Recommended Sections" : "Listings & Recommendations"}
                    <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                      ({totalFilteredRows} of {activeRows.length}
                      {allTrades.length > 0 ? `, ${allTrades.length} recommendation${allTrades.length > 1 ? "s" : ""}` : ""})
                    </Typography>
                  </Typography>
                }
              />
            </Paper>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export default MapWithListings;
