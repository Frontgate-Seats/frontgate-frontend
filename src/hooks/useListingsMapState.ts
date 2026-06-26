import * as React from "react";
import { useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";

import type { RootState } from "../store";
import { useAppDispatch } from "../store/reducers/root.reducer";
import {
  getListingsWithMap,
  resetListingsMapView,
  type VenueMapData,
} from "../store/slices/listingsMapView.slice";
import { getEvents } from "../store/slices/events.slice";
import { getTrades } from "../store/slices/trades.slice";

// ── Return type ───────────────────────────────────────────────────────────────
export interface ListingsMapState {
  // Redux data
  loading: boolean;
  error: string | null;
  tradesLoading: boolean;

  // Derived / computed
  eventInfo: any;
  effectiveMap: VenueMapData | null;
  enrichedListings: any[];
  filteredListings: any[];
  filteredTrades: any[];
  allTrades: any[];
  availableSectionIds: Set<number>;
  zoneOptions: string[];

  // Selection state
  selectedSections: Set<string>;
  selectedSectionIds: Set<number>;
  highlightedGroup: Set<number>;
  setSelectedSections: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedSectionIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  setHighlightedGroup: React.Dispatch<React.SetStateAction<Set<number>>>;

  // Handlers
  handleSectionClick: (sectionName: string, sectionId: number) => void;
  handleGroupClick: (groupId: number | null) => void;
  handleRefresh: () => void;

  // For URL row filter application
  urlRowFilter: string;
}

export function useListingsMapState(): ListingsMapState {
  const dispatch = useAppDispatch();
  const { event_id } = useParams<{ event_id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux state
  const { listings, map, loading, error, jsonMapUrl, staticUrl } = useSelector(
    (state: RootState) => state.listingsMapView,
  );
  const {
    rows: { data: events },
  } = useSelector((state: RootState) => state.events);
  const {
    rows: { data: trades },
    loading: tradesLoading,
  } = useSelector((state: RootState) => state.trades);

  // ── Local state — initialised from URL params ──────────────────────────────
  const urlSection = searchParams.get("section") || "";
  const urlRow = searchParams.get("row") || "";
  const urlZone = searchParams.get("zone") || "";

  const [selectedSections, setSelectedSections] = React.useState<Set<string>>(() => {
    if (urlSection) return new Set(urlSection.split(",").map((s) => s.toLowerCase()));
    return new Set();
  });
  const [selectedSectionIds, setSelectedSectionIds] = React.useState<Set<number>>(new Set());
  const [highlightedGroup, setHighlightedGroup] = React.useState<Set<number>>(new Set());
  const [urlRowFilter] = React.useState(urlRow);
  const [urlZoneFilter] = React.useState(urlZone);

  // ── Derived data ───────────────────────────────────────────────────────────
  const eventInfo = React.useMemo(() => {
    if (!events?.length) return {} as any;
    return events[0] || {};
  }, [events]);

  const effectiveMap = React.useMemo((): VenueMapData | null => {
    if (map) return map;
    if (jsonMapUrl || staticUrl) {
      return {
        jsonMapUrl: jsonMapUrl || null,
        staticUrl: staticUrl || null,
        groups: [],
        sections: [],
      };
    }
    return null;
  }, [map, jsonMapUrl, staticUrl]);

  const sectionToZone = React.useMemo(() => {
    const lookup: Record<number, string> = {};
    if (!effectiveMap) return lookup;
    const groupMap: Record<number, string> = {};
    effectiveMap.groups.forEach((g) => { groupMap[g.id] = g.name; });
    effectiveMap.sections.forEach((s) => {
      if (s.groupId != null && groupMap[s.groupId]) {
        lookup[s.id] = groupMap[s.groupId];
      }
    });
    return lookup;
  }, [effectiveMap]);

  const zoneOptions = React.useMemo(() => {
    return [...new Set(Object.values(sectionToZone))].sort();
  }, [sectionToZone]);

  const enrichedListings = React.useMemo(() => {
    return listings.map((l) => ({
      ...l,
      zone_name: sectionToZone[l.section?.id] || "—",
    }));
  }, [listings, sectionToZone]);

  const availableSectionIds = React.useMemo(() => {
    const set = new Set<number>();
    listings.forEach((l) => {
      if (l.section?.id) set.add(l.section.id);
    });
    return set;
  }, [listings]);

  const filteredListings = React.useMemo(() => {
    let result = enrichedListings;

    if (selectedSectionIds.size > 0) {
      result = result.filter((l) => selectedSectionIds.has(l.section?.id));
    } else if (highlightedGroup.size > 0 && effectiveMap) {
      const groupSectionIds = new Set(
        effectiveMap.sections
          .filter((s) => s.groupId != null && highlightedGroup.has(s.groupId))
          .map((s) => s.id),
      );
      result = result.filter((l) => groupSectionIds.has(l.section?.id));
    }

    return result;
  }, [enrichedListings, selectedSectionIds, highlightedGroup, effectiveMap]);

  const filteredTrades = React.useMemo(() => {
    if (!trades) return [];

    const sectionNameToZone: Record<string, string> = {};
    if (effectiveMap) {
      const groupMap: Record<number, string> = {};
      effectiveMap.groups.forEach((g) => { groupMap[g.id] = g.name; });
      effectiveMap.sections.forEach((s) => {
        if (s.groupId != null && groupMap[s.groupId]) {
          sectionNameToZone[s.name.toLowerCase()] = groupMap[s.groupId];
        }
      });
    }

    let result = trades.map((t: any) => ({
      ...t,
      zone_name: (t.vs_section && sectionNameToZone[t.vs_section.toLowerCase()]) || "—",
    }));

    if (selectedSections.size > 0) {
      result = result.filter(
        (t: any) => t.vs_section && selectedSections.has(t.vs_section.toLowerCase()),
      );
    } else if (highlightedGroup.size > 0 && effectiveMap) {
      const groupSectionNames = new Set(
        effectiveMap.sections
          .filter((s) => s.groupId != null && highlightedGroup.has(s.groupId))
          .map((s) => s.name.toLowerCase()),
      );
      result = result.filter(
        (t: any) => t.vs_section && groupSectionNames.has(t.vs_section.toLowerCase()),
      );
    }

    return result;
  }, [trades, selectedSections, highlightedGroup, effectiveMap]);

  // ── Effects ─────────────────────────────────────────────────────────────────
  // Fetch data on mount
  React.useEffect(() => {
    if (event_id) {
      dispatch(getListingsWithMap(event_id));
      dispatch(
        getEvents({
          page: 0,
          pageSize: 1,
          filters: {
            items: [{ field: "id", operator: "equals", value: event_id }],
          },
        }),
      );
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
    return () => {
      dispatch(resetListingsMapView());
    };
  }, [dispatch, event_id]);

  // Apply URL params once map loads
  React.useEffect(() => {
    if (!effectiveMap || effectiveMap.groups.length === 0) return;

    if (urlZoneFilter && highlightedGroup.size === 0 && selectedSections.size === 0) {
      const zoneNames = urlZoneFilter.split(",").map((z) => z.toLowerCase());
      const groupIds = new Set<number>();
      effectiveMap.groups.forEach((g) => {
        if (zoneNames.includes(g.name.toLowerCase())) {
          groupIds.add(g.id);
        }
      });
      if (groupIds.size > 0) {
        setHighlightedGroup(groupIds);
      }
    }

    if (urlSection && selectedSectionIds.size === 0 && selectedSections.size > 0) {
      const sectionIds = new Set<number>();
      effectiveMap.sections.forEach((s) => {
        if (selectedSections.has(s.name.toLowerCase())) {
          sectionIds.add(s.id);
        }
      });
      if (sectionIds.size > 0) {
        setSelectedSectionIds(sectionIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMap]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSectionClick = React.useCallback(
    (sectionName: string, sectionId: number) => {
      setSelectedSections((prev) => {
        const next = new Set(prev);
        const key = sectionName.toLowerCase();
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        // Update URL
        const params = new URLSearchParams(searchParams);
        if (next.size > 0) {
          params.set("section", [...next].join(","));
        } else {
          params.delete("section");
        }
        params.delete("zone");
        setSearchParams(params, { replace: true });
        return next;
      });
      setSelectedSectionIds((prev) => {
        const next = new Set(prev);
        if (next.has(sectionId)) {
          next.delete(sectionId);
        } else {
          next.add(sectionId);
        }
        return next;
      });
      setHighlightedGroup(new Set());
    },
    [searchParams, setSearchParams],
  );

  const handleGroupClick = React.useCallback(
    (groupId: number | null) => {
      setHighlightedGroup((prev) => {
        const next = new Set(prev);
        if (groupId == null) {
          return new Set();
        }
        if (next.has(groupId)) {
          next.delete(groupId);
        } else {
          next.add(groupId);
        }

        // Update URL using `next` (the correct new value, not stale closure)
        const params = new URLSearchParams(searchParams);
        params.delete("section");
        if (next.size > 0 && effectiveMap) {
          const zoneNames = effectiveMap.groups
            .filter((g) => next.has(g.id))
            .map((g) => g.name);
          params.set("zone", zoneNames.join(","));
        } else {
          params.delete("zone");
        }
        setSearchParams(params, { replace: true });

        return next;
      });

      setSelectedSections(new Set());
      setSelectedSectionIds(new Set());
    },
    [searchParams, setSearchParams, effectiveMap],
  );

  const handleRefresh = React.useCallback(() => {
    if (event_id) dispatch(getListingsWithMap(event_id));
  }, [dispatch, event_id]);

  return {
    loading,
    error,
    tradesLoading,
    eventInfo,
    effectiveMap,
    enrichedListings,
    filteredListings,
    filteredTrades,
    allTrades: trades || [],
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
  };
}
