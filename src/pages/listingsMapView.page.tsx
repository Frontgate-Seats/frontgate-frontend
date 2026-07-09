import * as React from "react";
import {
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";

import MapWithListings from "../components/venue/MapWithListings";
import { usePurchaseModal } from "../components/common/PurchaseModal";
import { formatDateTime } from "../shared/utils/dateTime.util";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { getEvents } from "../store/slices/events.slice";

export default function ListingsMapViewPage() {
  const { event_id } = useParams<{ event_id: string }>();
  const dispatch = useAppDispatch();
  const { openPurchaseModal } = usePurchaseModal();

  // Fetch event info for the header
  const {
    rows: { data: events },
    loading: eventsLoading,
  } = useSelector((state: RootState) => state.events);

  React.useEffect(() => {
    if (event_id) {
      dispatch(
        getEvents({
          page: 0,
          pageSize: 1,
          filters: {
            items: [{ field: "id", operator: "equals", value: event_id }],
          },
        }),
      );
    }
  }, [dispatch, event_id]);

  const eventInfo = React.useMemo(() => {
    if (!events?.length) return null;
    return events[0] || null;
  }, [events]);

  // ── Buy handler ─────────────────────────────────────────────────────────────
  const handleBuyClick = React.useCallback(
    (listing: { id: string; row: string; section_name: string; price: number; quantity: number; splits?: number[] }) => {
      openPurchaseModal(
        {
          id: listing.id,
          row: listing.row || "",
          section_name: listing.section_name || "",
          price: listing.price || 0,
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Stack padding={2} spacing={2} sx={{ height: "calc(100vh - 64px)", overflow: "hidden" }}>
      {/* Event Info Header */}
      {eventsLoading ? (
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
                  <IconButton size="small" onClick={() => { /* refresh handled by MapWithListings internally */ }} title="Refresh">
                    <RefreshIcon />
                  </IconButton>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      {/* Main Content: Map + Listings (reuses the same component as trade page) */}
      {event_id && (
        <MapWithListings
          event_id={event_id}
          onBuyClick={handleBuyClick}
          height={window.innerHeight - 200}
        />
      )}
    </Stack>
  );
}
