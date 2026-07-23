import { Box, Alert, Stack, Divider, Grid } from "@mui/material";
import * as React from "react";

import SalesTable from "../sales/SalesTable";
import MapWithListings from "../venue/MapWithListings";
import AvailabilityCharts from "../availability/AvailabilityCharts";
import EventMappingCard from "./EventMappingCard";
import type { Trade } from "../../shared/types/trade.types";
import supabaseClient from "../../clients/supabase.client";

export interface TradeDetailPanelProps {
  trade: Trade;
  onBuyClick?: (listing: { id: string; row: string; section_name: string; price: number; quantity: number; splits?: number[] }) => void;
}

// Sales table and charts share the same height
const PANEL_SECTION_HEIGHT = 380;

// Exported so trades.page.tsx can size the detail row precisely
// py:2(32) + 5×gap spacing:2(80) + match card(180) + 2×divider(2) + map(450) + sales/charts(380) + border(2)
export const TRADE_DETAIL_PANEL_HEIGHT = 32 + 80 + 180 + 2 + 450 + PANEL_SECTION_HEIGHT + 2;

export default function TradeDetailPanel({ trade, onBuyClick }: TradeDetailPanelProps) {
  const eventId = trade.event_id ? String(trade.event_id) : null;

  // Resolve external mappings once here so MapWithListings doesn't need its own
  // DB calls — EventMappingCard does the same query, but it's a sibling and
  // doesn't expose the resolved IDs as props. Fetching here is a single round-trip
  // that both MapWithListings and (implicitly) the sales/listings fetches share.
  const [sgEventId, setSgEventId] = React.useState<string | null | undefined>(undefined);
  const [stubhubEventId, setStubhubEventId] = React.useState<string | null | undefined>(undefined);

  // Section names (lowercase) selected via zone/section click on the venue map.
  // Passed to SalesTable so the sales chart/table shows only that zone's data.
  const [zoneSectionFilter, setZoneSectionFilter] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!eventId) return;
    setSgEventId(undefined);
    setStubhubEventId(undefined);

    Promise.all([
      supabaseClient
        .from("events_external_mapping")
        .select("external_event_id")
        .eq("event_id", eventId)
        .eq("external_platform", "seatgeek")
        .maybeSingle(),
      supabaseClient
        .from("events_external_mapping")
        .select("external_event_id")
        .eq("event_id", eventId)
        .eq("external_platform", "stubhub")
        .maybeSingle(),
    ]).then(([sgRes, shRes]) => {
      setSgEventId(sgRes.data?.external_event_id ? String(sgRes.data.external_event_id) : null);
      setStubhubEventId(shRes.data?.external_event_id ? String(shRes.data.external_event_id) : null);
    }).catch(() => {
      // Fall back to null so children resolve internally via their own fallback path
      setSgEventId(null);
      setStubhubEventId(null);
    });
  }, [eventId]);

  return (
    <Box
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      sx={{
        width: "100%",
        px: 2,
        py: 2,
        bgcolor: "background.default",
        borderTop: "2px solid",
        borderColor: "primary.main",
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={2}>
        {eventId === null && (
          <Alert severity="warning">Event ID not available for this trade</Alert>
        )}

        {/* ── ROW 1: SG + PM match ── */}
        <EventMappingCard trade={trade} />

        <Divider />

        {/* ── ROW 2: Map + Listings ── */}
        {eventId && (
          <MapWithListings
            event_id={eventId}
            trade={trade}
            onBuyClick={onBuyClick}
            height={450}
            sgEventId={sgEventId}
            stubhubEventId={stubhubEventId}
            onSectionFilterChange={setZoneSectionFilter}
          />
        )}

        <Divider />

        {/* ── ROW 3: Sales (left) | PM availability charts (right) ── */}
        <Grid container spacing={2} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ minHeight: PANEL_SECTION_HEIGHT }}>
              <SalesTable
                eventId={eventId || ""}
                height={PANEL_SECTION_HEIGHT}
                sgEventId={sgEventId}
                stubhubEventId={stubhubEventId}
                zoneSectionFilter={zoneSectionFilter}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {eventId && (
              <AvailabilityCharts
                eventId={eventId}
                chartHeight={PANEL_SECTION_HEIGHT}
              />
            )}
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
