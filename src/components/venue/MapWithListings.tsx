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
import tfsListingsApi from "../../apis/tfsListings.api";
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

type SourceFilter = "recommendations" | "vivid" | "tfs";

// ─── Component ────────────────────────────────────────────────────────────────

const MapWithListings: React.FC<MapWithListingsProps> = ({
  event_id,
  trade,
  onBuyClick,
  height = 450,
}) => {
  const [listings, setListings] = React.useState<any[]>([]);
  const [tfsListings, setTfsListings] = React.useState<any[]>([]);
  const [mapData, setMapData] = React.useState<VenueMapData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [allTrades, setAllTrades] = React.useState<Trade[]>([]);

  const [selectedSections, setSelectedSections] = React.useState<Set<string>>(new Set());
  const [selectedSectionIds, setSelectedSectionIds] = React.useState<Set<number>>(new Set());
  const [highlightedGroup, setHighlightedGroup] = React.useState<Set<number>>(new Set());

  const [showRecommendedSections, setShowRecommendedSections] = React.useState(false);
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter[]>(["recommendations", "vivid", "tfs"]);
  const [recommendationTime, setRecommendationTime] = React.useState<"all" | "today" | "thisWeek">("all");

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchListingsWithMap = React.useCallback(() => {
    if (!event_id) return;
    setLoading(true);
    setError(null);

    const listingsPromise = listingsApi.fetchListingsWithMap(event_id).then((res) => {
      setListings(res.listings ?? []);
      setMapData(res.map ?? null);
    }).catch((err) => {
      console.warn("[Listings] Failed:", err?.message);
    });

    const tfsPromise = tfsListingsApi.fetchTfsListings(event_id).then((res) => {
      setTfsListings(res ?? []);
    }).catch((err) => {
      console.warn("[TFS] Failed:", err?.message);
    });

    const tradesPromise = supabaseClient
      .from("event_buy_listings_logs")
      .select(`
        id, event_id, listing_id, vs_section, row, quantity,
        max_buy_price, projected_sell_price, estimated_margin_percent,
        confidence_level, created_at, llm_result_comment,
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
          sell_source: null, buy_source: null, llm_matched_section: null,
        }));
        setAllTrades(flat as Trade[]);
      }).catch((err) => {
        console.warn("[Trades] Failed:", err?.message);
      });

    Promise.allSettled([listingsPromise, tfsPromise, tradesPromise])
      .finally(() => setLoading(false));
  }, [event_id]);

  React.useEffect(() => { fetchListingsWithMap(); }, [fetchListingsWithMap]);

  // ─── Derived Data ───────────────────────────────────────────────────────────

  const sectionToZone = React.useMemo(() => {
    const lookup: Record<number, string> = {};
    if (!mapData) return lookup;
    const groupMap: Record<number, string> = {};
    mapData.groups.forEach((g) => { groupMap[g.id] = g.name; });
    mapData.sections.forEach((s) => {
      if (s.groupId != null && groupMap[s.groupId]) lookup[s.id] = groupMap[s.groupId];
    });
    return lookup;
  }, [mapData]);

  const enrichedListings = React.useMemo(() =>
    listings.map((l: any) => ({
      ...l,
      zone_name: sectionToZone[l.section?.id] || "—",
      section_name: l.section_name ?? l.section?.name ?? "—",
    })),
  [listings, sectionToZone]);

  const availableSectionIds = React.useMemo(() => {
    const set = new Set<number>();
    listings.forEach((l: any) => { if (l.section?.id) set.add(l.section.id); });
    return set;
  }, [listings]);

  // ─── Section/Group Filtering ────────────────────────────────────────────────

  const filteredListings = React.useMemo(() => {
    let result = enrichedListings;
    if (selectedSectionIds.size > 0) {
      result = result.filter((l: any) => selectedSectionIds.has(l.section?.id));
    } else if (highlightedGroup.size > 0 && mapData) {
      const ids = new Set(mapData.sections.filter((s) => s.groupId != null && highlightedGroup.has(s.groupId!)).map((s) => s.id));
      result = result.filter((l: any) => ids.has(l.section?.id));
    }
    return result;
  }, [enrichedListings, selectedSectionIds, highlightedGroup, mapData]);

  const filteredTfsListings = React.useMemo(() => {
    if (selectedSections.size === 0 && highlightedGroup.size === 0) return tfsListings;
    if (selectedSections.size > 0) {
      return tfsListings.filter((l: any) => l.section_name && selectedSections.has(l.section_name.toLowerCase()));
    }
    if (highlightedGroup.size > 0 && mapData) {
      const names = new Set(mapData.sections.filter((s) => s.groupId != null && highlightedGroup.has(s.groupId!)).map((s) => s.name.toLowerCase()));
      return tfsListings.filter((l: any) => l.section_name && names.has(l.section_name.toLowerCase()));
    }
    return tfsListings;
  }, [tfsListings, selectedSections, highlightedGroup, mapData]);

  const filteredTrades = React.useMemo(() => {
    let result = [...allTrades];
    if (selectedSections.size > 0) {
      result = result.filter((t) => t.vs_section && selectedSections.has(t.vs_section.toLowerCase()));
    } else if (highlightedGroup.size > 0 && mapData) {
      const names = new Set(mapData.sections.filter((s) => s.groupId != null && highlightedGroup.has(s.groupId!)).map((s) => s.name.toLowerCase()));
      result = result.filter((t) => t.vs_section && names.has(t.vs_section.toLowerCase()));
    }
    return result;
  }, [allTrades, selectedSections, highlightedGroup, mapData]);

  const filteredTradesByTime = React.useMemo(() => {
    if (recommendationTime === "all") return filteredTrades;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return filteredTrades.filter((t) => {
      if (!t.created_at) return false;
      const d = new Date(t.created_at);
      return recommendationTime === "today" ? d >= todayStart : d >= weekStart;
    });
  }, [filteredTrades, recommendationTime]);

  // ─── Merge Rows ─────────────────────────────────────────────────────────────

  const mergedRows = React.useMemo(() => {
    const availableIds = new Set<string>();
    filteredListings.forEach((l: any) => { if (l.id) availableIds.add(String(l.id)); });

    const recSections = new Set<string>();
    filteredTradesByTime.forEach((t) => { if (t.vs_section) recSections.add(t.vs_section.toLowerCase()); });

    const tradeRows = sourceFilter.includes("recommendations")
      ? filteredTradesByTime.map((t) => ({
          id: `trade-${t.id}`, listingId: t.listing_id || "",
          section_name: t.vs_section || "—", row: t.row || "—",
          quantity: t.quantity || 1, price: t.max_buy_price || 0,
          isRecommendation: true, isInRecommendedSection: true,
          isListingAvailable: t.listing_id ? availableIds.has(t.listing_id) : false,
          projected_sell_price: t.projected_sell_price, confidence_level: t.confidence_level,
          recommendation_date: t.created_at, estimated_margin_percent: t.estimated_margin_percent,
          _trade: t, _isCurrentTrade: t.id === trade?.id, _source: "recommendations" as const,
        }))
      : [];

    const listingRows = sourceFilter.includes("vivid")
      ? filteredListings.map((l: any) => ({
          ...l, listingId: l.listingId || l.id || "",
          price: l.pricePerTicket ?? l.price ?? l.listPrice ?? null,
          isRecommendation: false, isListingAvailable: true, _trade: null,
          isInRecommendedSection: recSections.has((l.section_name || "").toLowerCase()),
          _source: "vivid" as const,
        }))
      : [];

    const tfsRows = sourceFilter.includes("tfs")
      ? filteredTfsListings.map((l: any) => ({
          ...l, listingId: l.listingId || "", isRecommendation: false,
          isListingAvailable: true, _trade: null,
          isInRecommendedSection: recSections.has((l.section_name || "").toLowerCase()),
          _source: "tfs" as const,
        }))
      : [];

    return [...tradeRows, ...listingRows, ...tfsRows];
  }, [filteredListings, filteredTfsListings, filteredTradesByTime, sourceFilter, trade?.id]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleBuyClick = React.useCallback((row: any) => {
    if (!onBuyClick || !row.listingId) return;
    onBuyClick({ ...row, id: row.listingId, quantity: Number(row.quantity) });
  }, [onBuyClick]);

  const mergedColumns = React.useMemo(() => getMergedColumns(handleBuyClick), [handleBuyClick]);

  const {
    paginationModel, sortModel, filterModel,
    setPaginationModel, setSortModel, setFilterModel,
    paginatedRows, totalFilteredRows,
  } = useClientFilters({
    data: mergedRows,
    columns: mergedColumns,
    initialPaginationModel: { page: 0, pageSize: 50 },
    initialSortModel: [{ field: "price", sort: "asc" }],
  });

  const handleSectionClick = React.useCallback((sectionName: string, sectionId: number) => {
    setSelectedSections((prev) => { const n = new Set(prev); const k = sectionName.toLowerCase(); n.has(k) ? n.delete(k) : n.add(k); return n; });
    setSelectedSectionIds((prev) => { const n = new Set(prev); n.has(sectionId) ? n.delete(sectionId) : n.add(sectionId); return n; });
    setHighlightedGroup(new Set());
  }, []);

  const handleGroupClick = React.useCallback((groupId: number | null) => {
    setHighlightedGroup((prev) => { if (groupId == null) return new Set(); const n = new Set(prev); n.has(groupId) ? n.delete(groupId) : n.add(groupId); return n; });
    setSelectedSections(new Set());
    setSelectedSectionIds(new Set());
  }, []);

  const handleShowRecommendedSectionsChange = React.useCallback((checked: boolean) => {
    setShowRecommendedSections(checked);
    if (checked && mapData && allTrades.length > 0) {
      const recNames = new Set(allTrades.map((t) => (t.vs_section || "").toLowerCase()).filter(Boolean));
      const sIds = new Set<number>(); const gIds = new Set<number>();
      mapData.sections.forEach((s) => { if (recNames.has(s.name.toLowerCase())) { sIds.add(s.id); if (s.groupId != null) gIds.add(s.groupId); } });
      setSelectedSections(new Set()); setSelectedSectionIds(sIds); setHighlightedGroup(gIds);
    } else {
      setSelectedSections(new Set()); setSelectedSectionIds(new Set()); setHighlightedGroup(new Set());
    }
  }, [mapData, allTrades]);

  const handleSourceFilterChange = React.useCallback((_e: React.MouseEvent<HTMLElement>, v: SourceFilter[]) => {
    if (v.length > 0) setSourceFilter(v);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ height, width: "100%" }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: "flex", height: "100%" }}>
        {/* Left: Venue Map */}
        <Box sx={{ flex: "0 0 35%", height: "100%" }}>
          <ToggleFullscreen fillHeight>
            <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }} spacing={1}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" color="text.secondary">Loading venue map...</Typography>
                </Stack>
              ) : mapData ? (
                <>
                  <Box sx={{ flexShrink: 0, maxHeight: 60, overflowY: "auto", overflowX: "hidden" }}>
                    <ZoneLegend groups={mapData.groups} sections={mapData.sections} highlightedGroup={highlightedGroup} onGroupClick={handleGroupClick} availableSectionIds={availableSectionIds} />
                  </Box>
                  <Divider sx={{ margin: 1 }} />
                  <Box sx={{ flex: 1, minHeight: 0 }}>
                    <VenueMap mapData={mapData} selectedSections={selectedSections} onSectionClick={handleSectionClick} highlightedGroup={highlightedGroup} availableSectionIds={availableSectionIds} />
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

        {/* Right: Filters + Table */}
        <Box sx={{ flex: 1, height: "100%", ml: 2, display: "flex", flexDirection: "column" }}>
          {/* Filter Controls */}
          <Box sx={{ flexShrink: 0, mb: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <FormControlLabel
                control={<Checkbox checked={showRecommendedSections} onChange={(e) => handleShowRecommendedSectionsChange(e.target.checked)} size="small" color="success" disabled={allTrades.length === 0} />}
                label={<Typography variant="body2" fontWeight={500}>Show Recommended Sections</Typography>}
              />

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              <ToggleButtonGroup
                value={recommendationTime}
                exclusive
                onChange={(_e, v) => { if (v) setRecommendationTime(v); }}
                size="small"
                disabled={!sourceFilter.includes("recommendations") || allTrades.length === 0}
                sx={{ "& .MuiToggleButton-root": { px: 1.5, py: 0.5, fontSize: "0.75rem", textTransform: "none" } }}
              >
                <ToggleButton value="today">Today</ToggleButton>
                <ToggleButton value="thisWeek">This Week</ToggleButton>
                <ToggleButton value="all">All</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Box>

          {/* Table */}
          <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, borderRadius: 1, overflow: "hidden", padding: 2, display: "flex", flexDirection: "column" }}>
            <CustomDataGrid
              title="Listings"
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
                  if (row._isCurrentTrade) return "recommendation-row-current";
                  if (row.isListingAvailable === false) return "recommendation-row-unavailable";
                  return "recommendation-row-available";
                }
                if (row._source === "tfs") return "tfs-row";
                return "";
              }}
              headerComponent={
                <Typography variant="subtitle1" fontWeight={600}>
                  Listings
                  <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                    ({totalFilteredRows} of {mergedRows.length})
                  </Typography>
                </Typography>
              }
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default MapWithListings;
