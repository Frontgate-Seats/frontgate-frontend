import { Box, Alert, Stack, Divider, Grid } from "@mui/material";

import SalesTable from "../sales/SalesTable";
import MapWithListings from "../venue/MapWithListings";
import AvailabilityCharts from "../availability/AvailabilityCharts";
import EventMappingCard from "./EventMappingCard";
import type { Trade } from "../../shared/types/trade.types";

export interface ListingRow {
  id: string;
  listingId: string;
  section_name: string;
  row: string;
  quantity: number | string;
  price: number | null;
}

export type ListingsCache = Record<string, { data: ListingRow[]; loading: boolean; error: string | null }>;

export interface TradeDetailPanelProps {
  trade: Trade;
  onBuyClick?: (listing: { id: string; row: string; section_name: string; price: number; quantity: number; splits?: number[] }) => void;
}

// Sales table and charts share the same row
const SALES_HEIGHT = 380;
// Charts section total height matches the sales table
const CHART_HEIGHT = SALES_HEIGHT;

// Exported so trades.page.tsx can size the detail row precisely
// py:2(32) + 4×gap spacing:2(64) + match card(96) + 2×divider(2) + map(450) + sales/charts(380) + border(2)
export const TRADE_DETAIL_PANEL_HEIGHT = 32 + 64 + 96 + 2 + 450 + 380 + 2;

export default function TradeDetailPanel({ trade, onBuyClick }: TradeDetailPanelProps) {
  const eventId = trade.event_id ? String(trade.event_id) : null;

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
          />
        )}

        <Divider />

        {/* ── ROW 3: Sales (left) | PM availability charts (right) ── */}
        <Grid container spacing={2} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ height: SALES_HEIGHT }}>
              <SalesTable eventId={eventId || ""} height={SALES_HEIGHT} />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {eventId && (
              <AvailabilityCharts
                eventId={eventId}
                chartHeight={CHART_HEIGHT}
              />
            )}
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
