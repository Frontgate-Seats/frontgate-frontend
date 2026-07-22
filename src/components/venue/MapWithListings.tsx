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
import type { GridFilterModel } from "@mui/x-data-grid";

import listingsApi from "../../apis/listings.api";
import hermesListingsApi from "../../apis/tfsListings.api";
import stubhubListingsApi from "../../apis/stubhubListings.api";
import seatgeekListingsApi from "../../apis/seatgeekListings.api";
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
  /**
   * Pre-resolved SeatGeek external event ID. When provided (e.g. from
   * TradeDetailPanel which already fetches the mapping), the component skips
   * its own DB lookup. `null` means the event has no SeatGeek mapping.
   * `undefined` means not yet resolved / not provided (do the lookup internally).
   */
  sgEventId?: string | null;
  /**
   * Pre-resolved StubHub external event ID. Same semantics as sgEventId.
   */
  stubhubEventId?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

const MapWithListings: React.FC<MapWithListingsProps> = ({
  event_id,
  trade,
  onBuyClick,
  height = 450,
  sgEventId: sgEventIdProp,
  stubhubEventId: stubhubEventIdProp,
}) => {
  const [listings, setListings] = React.useState<any[]>([]);
  const [hermesListings, setHermesListings] = React.useState<any[]>([]);
  const [stubhubListings, setStubhubListings] = React.useState<any[]>([]);
  const [seatgeekListings, setSeatgeekListings] = React.useState<any[]>([]);
  const [mapData, setMapData] = React.useState<VenueMapData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [allTrades, setAllTrades] = React.useState<Trade[]>([]);

  // Map visual state — which sections/groups are highlighted on the map
  const [selectedSections, setSelectedSections] = React.useState<Set<string>>(new Set());
  const [highlightedGroup, setHighlightedGroup] = React.useState<Set<number>>(new Set());

  const [showRecommendedSections, setShowRecommendedSections] = React.useState(false);
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

    const hermesPromise = hermesListingsApi.fetchHermesListings(event_id).then((res) => {
      setHermesListings(res ?? []);
    }).catch((err) => {
      console.warn("[Hermes] Failed:", err?.message);
    });

    // StubHub: use pre-resolved ID from props (TradeDetailPanel) or resolve inline
    // (standalone listings page). `null` prop = no mapping; `undefined` = not provided.
    const stubhubPromise = stubhubEventIdProp !== undefined
      ? (stubhubEventIdProp
          ? stubhubListingsApi.fetchStubHubListings(stubhubEventIdProp)
              .then((res) => setStubhubListings(res ?? []))
              .catch((err: any) => console.warn("[StubHub Listings] Failed:", err?.message))
          : Promise.resolve())
      : Promise.resolve(
          supabaseClient
            .from("events_external_mapping")
            .select("external_event_id")
            .eq("event_id", event_id)
            .eq("external_platform", "stubhub")
            .maybeSingle()
        )
          .then(({ data: mapping }) => {
            if (!mapping?.external_event_id) return;
            return stubhubListingsApi.fetchStubHubListings(String(mapping.external_event_id))
              .then((res) => setStubhubListings(res ?? []));
          })
          .catch((err: any) => console.warn("[StubHub Listings] Failed:", err?.message));

    // SeatGeek: same pattern — use prop when available, resolve inline otherwise
    const seatgeekPromise = sgEventIdProp !== undefined
      ? (sgEventIdProp
          ? seatgeekListingsApi.fetchSeatGeekListings(sgEventIdProp)
              .then((res) => setSeatgeekListings(res ?? []))
              .catch((err: any) => console.warn("[SeatGeek Listings] Failed:", err?.message))
          : Promise.resolve())
      : Promise.resolve(
          supabaseClient
            .from("events_external_mapping")
            .select("external_event_id")
            .eq("event_id", event_id)
            .eq("external_platform", "seatgeek")
            .maybeSingle()
        )
          .then(({ data: mapping }) => {
            if (!mapping?.external_event_id) return;
            return seatgeekListingsApi.fetchSeatGeekListings(String(mapping.external_event_id))
              .then((res) => setSeatgeekListings(res ?? []));
          })
          .catch((err: any) => console.warn("[SeatGeek Listings] Failed:", err?.message));

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
      .then(
        ({ data }) => {
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
        },
        (err: any) => {
          console.warn("[Trades] Failed:", err?.message);
        }
      );

    Promise.allSettled([listingsPromise, hermesPromise, stubhubPromise, seatgeekPromise, tradesPromise])
      .finally(() => setLoading(false));
  }, [event_id, sgEventIdProp, stubhubEventIdProp]);

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

  const availableSectionIds = React.useMemo(() => {
    const set = new Set<number>();
    listings.forEach((l: any) => { if (l.section?.id) set.add(l.section.id); });
    return set;
  }, [listings]);

  // ─── All rows (no external filtering — filtering is done via DataGrid filterModel) ──

  const filteredTradesByTime = React.useMemo(() => {
    if (recommendationTime === "all") return allTrades;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return allTrades.filter((t) => {
      if (!t.created_at) return false;
      const d = new Date(t.created_at);
      return recommendationTime === "today" ? d >= todayStart : d >= weekStart;
    });
  }, [allTrades, recommendationTime]);

  const mergedRows = React.useMemo(() => {
    const enrichedListings = listings.map((l: any) => ({
      ...l,
      zone_name: sectionToZone[l.section?.id] || "—",
      section_name: l.section_name ?? l.section?.name ?? "—",
    }));

    const availableIds = new Set<string>();
    enrichedListings.forEach((l: any) => { if (l.id) availableIds.add(String(l.id)); });

    const recSections = new Set<string>();
    filteredTradesByTime.forEach((t) => { if (t.vs_section) recSections.add(t.vs_section.toLowerCase()); });

    const tradeRows = filteredTradesByTime.map((t) => ({
      id: `trade-${t.id}`, listingId: t.listing_id || "",
      section_name: t.vs_section || "—", row: t.row || "—",
      quantity: t.quantity || 1, price: t.max_buy_price || 0,
      isRecommendation: true, isInRecommendedSection: true,
      isListingAvailable: t.listing_id ? availableIds.has(t.listing_id) : false,
      projected_sell_price: t.projected_sell_price, confidence_level: t.confidence_level,
      recommendation_date: t.created_at, estimated_margin_percent: t.estimated_margin_percent,
      _trade: t, _isCurrentTrade: t.id === trade?.id, _source: "recommendations" as const,
    }));

    const listingRows = enrichedListings.map((l: any) => ({
      ...l, listingId: l.listingId || l.id || "",
      price: l.pricePerTicket ?? l.price ?? l.listPrice ?? null,
      isRecommendation: false, isListingAvailable: true, _trade: null,
      isInRecommendedSection: recSections.has((l.section_name || "").toLowerCase()),
      _source: "vivid" as const,
    }));

    const hermesRows = hermesListings.map((l: any) => ({
      ...l, listingId: l.listingId || "", isRecommendation: false,
      isListingAvailable: true, _trade: null,
      isInRecommendedSection: recSections.has((l.section_name || "").toLowerCase()),
      _source: "hermes" as const,
    }));

    const stubhubRows = stubhubListings.map((l: any) => ({
      ...l,
      id: `stubhub-${l.listingId || Math.random()}`,
      listingId: l.listingId || "",
      isRecommendation: false,
      isListingAvailable: true,
      _trade: null,
      isInRecommendedSection: recSections.has((l.section_name || "").toLowerCase()),
      _source: "stubhub" as const,
    }));

    const seatgeekRows = seatgeekListings.map((l: any) => ({
      ...l,
      id: `seatgeek-${l.listingId || Math.random()}`,
      listingId: l.listingId || "",
      isRecommendation: false,
      isListingAvailable: true,
      _trade: null,
      isInRecommendedSection: recSections.has((l.section_name || "").toLowerCase()),
      _source: "seatgeek" as const,
    }));

    return [...tradeRows, ...listingRows, ...hermesRows, ...stubhubRows, ...seatgeekRows];
  }, [listings, hermesListings, stubhubListings, seatgeekListings, filteredTradesByTime, sectionToZone, trade?.id]);

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

  /**
   * Build a filterModel that filters by section name(s) and source.
   * Uses the DataGrid's own filterModel so the filters are visible in the header inputs.
   */
  const applySectionFilter = React.useCallback((
    sectionNames: string[],   // exact names (case-insensitive match via "contains" per name)
    sourceValues: string[],   // e.g. ["vivid"] or ["recommendations","vivid","tfs"]
  ) => {
    const items: GridFilterModel["items"] = [];

    if (sectionNames.length === 1) {
      // Single section — use "contains" so it shows in the text filter input
      items.push({
        id: "section-filter",
        field: "section_name",
        operator: "contains",
        value: sectionNames[0],
      });
    } else if (sectionNames.length > 1) {
      // Multiple sections (group click) — use isAnyOf
      items.push({
        id: "section-filter",
        field: "section_name",
        operator: "isAnyOf",
        value: sectionNames,
      });
    }

    // Total number of source options — if all are selected, no source filter is needed
    const TOTAL_SOURCES = 5; // recommendations, vivid, hermes, stubhub, seatgeek
    if (sourceValues.length < TOTAL_SOURCES) {
      // Not all sources — set a source filter visible in the _source column header
      items.push({
        id: "source-filter",
        field: "_source",
        operator: "isAnyOf",
        value: sourceValues,
      });
    }

    setFilterModel({ items });
  }, [setFilterModel]);

  const clearSectionFilter = React.useCallback(() => {
    setFilterModel((prev) => ({
      ...prev,
      items: prev.items.filter(
        (item) => item.id !== "section-filter" && item.id !== "source-filter"
      ),
    }));
  }, [setFilterModel]);

  const handleSectionClick = React.useCallback((sectionName: string, _sectionId: number) => {
    const k = sectionName.toLowerCase();

    setSelectedSections((prev) => {
      const n = new Set(prev);
      if (n.has(k)) {
        n.delete(k);
        if (n.size === 0) {
          // Fully deselected — clear the DataGrid filters
          clearSectionFilter();
        } else {
          // Still have other sections selected — update filter
          applySectionFilter(Array.from(n), ["vivid"]);
        }
      } else {
        n.add(k);
        // Section selected: filter to Vivid only for this section
        setShowRecommendedSections(false);
        applySectionFilter(Array.from(n), ["vivid"]);
      }
      return n;
    });
    setHighlightedGroup(new Set());
  }, [applySectionFilter, clearSectionFilter]);

  const handleGroupClick = React.useCallback((groupId: number | null) => {
    setHighlightedGroup((prev) => {
      if (groupId == null) {
        clearSectionFilter();
        setSelectedSections(new Set());
        return new Set();
      }
      const n = new Set(prev);
      if (n.has(groupId)) {
        n.delete(groupId);
        if (n.size === 0) {
          clearSectionFilter();
        } else {
          // Remaining groups — rebuild section names for those groups
          if (mapData) {
            const names = mapData.sections
              .filter((s) => s.groupId != null && n.has(s.groupId!))
              .map((s) => s.name.toLowerCase());
            applySectionFilter(names, ["vivid"]);
          }
        }
      } else {
        n.add(groupId);
        setShowRecommendedSections(false);
        if (mapData) {
          const names = Array.from(n).flatMap((gId) =>
            mapData.sections
              .filter((s) => s.groupId === gId)
              .map((s) => s.name.toLowerCase())
          );
          applySectionFilter(names, ["vivid"]);
        }
      }
      setSelectedSections(new Set());
      return n;
    });
  }, [mapData, applySectionFilter, clearSectionFilter]);

  const handleShowRecommendedSectionsChange = React.useCallback((checked: boolean) => {
    setShowRecommendedSections(checked);
    if (checked && mapData && allTrades.length > 0) {
      const recNames = Array.from(
        new Set(allTrades.map((t) => (t.vs_section || "").toLowerCase()).filter(Boolean))
      );
      // Highlight on map
      const gIds = new Set<number>();
      mapData.sections.forEach((s) => {
        if (recNames.includes(s.name.toLowerCase())) {
          if (s.groupId != null) gIds.add(s.groupId);
        }
      });
      setSelectedSections(new Set(recNames));
      setHighlightedGroup(gIds);
      // Set DataGrid filter — show all sources for recommended sections
      applySectionFilter(recNames, ["recommendations", "vivid", "hermes", "stubhub", "seatgeek"]);
    } else {
      setSelectedSections(new Set());
      setHighlightedGroup(new Set());
      clearSectionFilter();
    }
  }, [mapData, allTrades, applySectionFilter, clearSectionFilter]);

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
                control={
                  <Checkbox
                    checked={showRecommendedSections}
                    onChange={(e) => handleShowRecommendedSectionsChange(e.target.checked)}
                    size="small"
                    color="success"
                    disabled={allTrades.length === 0}
                  />
                }
                label={<Typography variant="body2" fontWeight={500}>Show Recommended Sections</Typography>}
              />

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              <ToggleButtonGroup
                value={recommendationTime}
                exclusive
                onChange={(_e, v) => { if (v) setRecommendationTime(v); }}
                size="small"
                disabled={allTrades.length === 0}
                sx={{ "& .MuiToggleButton-root": { px: 1.5, py: 0.5, fontSize: "0.75rem", textTransform: "none" } }}
              >
                <ToggleButton value="today">Today</ToggleButton>
                <ToggleButton value="thisWeek">This Week</ToggleButton>
                <ToggleButton value="all">All</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Box>

          {/* Table — filters set by map clicks appear in the column header inputs */}
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
              initialShowFilters
              getRowClassName={(params: unknown) => {
                const row = (params as { row?: any })?.row;
                if (!row) return "";
                if (row.isRecommendation) {
                  if (row._isCurrentTrade) return "recommendation-row-current";
                  if (row.isListingAvailable === false) return "recommendation-row-unavailable";
                  return "recommendation-row-available";
                }
                if (row._source === "hermes") return "hermes-row";
                if (row._source === "stubhub") return "stubhub-row";
                return "";
              }}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default MapWithListings;
