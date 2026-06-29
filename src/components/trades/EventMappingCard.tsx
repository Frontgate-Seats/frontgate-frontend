import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Skeleton,
  Link,
  Tooltip,
  Divider,
  Grid,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/reducers/root.reducer";
import { getSGEvent } from "../../store/slices/sgevents.slice";import type { RootState } from "../../store";
import supabaseClient from "../../clients/supabase.client";
import { formatDateTime } from "../../shared/utils/dateTime.util";
import moment from "moment";
import type { Trade } from "../../shared/types/trade.types";

interface EventMapping {
  external_event_id: number | string;
  mapping_confidence: number | null;
  is_verified: boolean;
}

interface EventMappingCardProps {
  trade: Trade;
}

// ─── One labelled field ───────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.disabled"
        display="block"
        sx={{ fontSize: "0.65rem", lineHeight: 1.2, mb: 0.1, whiteSpace: "nowrap" }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontSize: "0.78rem", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {children ?? <Box component="span" sx={{ color: "text.disabled" }}>—</Box>}
      </Typography>
    </Box>
  );
}

// ─── Platform row ─────────────────────────────────────────────────────────────
function PlatformRow({
  logo,
  title,
  isVerified,
  loading,
  noMatch,
  children,
}: {
  logo: string;
  title: string;
  isVerified?: boolean;
  loading?: boolean;
  noMatch?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
      {/* Logo + verified */}
      <Stack direction="row" alignItems="center" spacing={0.4} sx={{ flexShrink: 0, width: 32 }}>
        <Tooltip title={title}>
          <Box
            component="img"
            src={logo}
            alt={title}
            sx={{ width: 18, height: 18, objectFit: "contain" }}
            onError={(e: any) => { e.currentTarget.style.display = "none"; }}
          />
        </Tooltip>
        {isVerified && (
          <Tooltip title="Verified mapping">
            <CheckCircleOutlineIcon sx={{ fontSize: 12, color: "success.main" }} />
          </Tooltip>
        )}
      </Stack>

      <Divider orientation="vertical" flexItem />

      {/* Content */}
      {loading ? (
        <Stack direction="row" spacing={3} sx={{ flex: 1 }}>
          {[80, 140, 110, 120, 90].map((w) => (
            <Skeleton key={w} variant="text" width={w} height={32} />
          ))}
        </Stack>
      ) : noMatch ? (
        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
          No Data Available
        </Typography>
      ) : (
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {children}
        </Box>
      )}
    </Stack>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const EventMappingCard: React.FC<EventMappingCardProps> = ({ trade }) => {
  const dispatch = useAppDispatch();
  const [mapping, setMapping] = React.useState<EventMapping | null>(null);
  const [mappingLoading, setMappingLoading] = React.useState(false);

  const sgevents = useSelector((state: RootState) => state.sgevents);
  const availabilityFromRedux = useSelector((state: RootState) => state.availability);

  React.useEffect(() => {
    if (!trade.event_id) return;
    setMappingLoading(true);
    setMapping(null);
    supabaseClient
      .from("events_external_mapping")
      .select("external_event_id, mapping_confidence, is_verified")
      .eq("event_id", trade.event_id)
      .eq("external_platform", "seatgeek")
      .maybeSingle()
      .then(({ data }) => {
        setMapping(data ?? null);
        setMappingLoading(false);
      });
  }, [trade.event_id]);

  React.useEffect(() => {
    if (!mapping?.external_event_id) return;
    dispatch(getSGEvent(String(mapping.external_event_id)));
  }, [dispatch, mapping?.external_event_id]);

  // PM event data is fetched by AvailabilityCharts — just read from Redux here

  const sgEvent = React.useMemo(
    () =>
      mapping?.external_event_id
        ? sgevents.rows.data.find((e: any) => String(e.id) === String(mapping.external_event_id)) ?? null
        : null,
    [sgevents.rows.data, mapping?.external_event_id],
  );

  const pmEvent = availabilityFromRedux.data?.pmEvent ?? null;
  const sgLoading = mappingLoading || (!!mapping && !sgEvent && sgevents.loading);

  const sgHref = sgEvent?.web_path
    ? sgEvent.web_path.startsWith("http") ? sgEvent.web_path : `https://seatgeek.com${sgEvent.web_path}`
    : null;

  const pmHref =
    pmEvent?.eventUrl ?? (pmEvent?.id ? `https://www.ticketmaster.com/event/${pmEvent.id}` : null);

  const SgFields = sgEvent ? (
    <Grid container spacing={1.5} columns={11}>
      <Grid size={1}>
        <Field label="Event ID">
          {sgHref
            ? <Link href={sgHref} target="_blank" rel="noopener noreferrer" underline="hover" color="primary">{sgEvent.id}</Link>
            : sgEvent.id}
        </Field>
      </Grid>
      <Grid size={2}><Field label="Name">{sgEvent.name}</Field></Grid>
      <Grid size={3}>
        <Field label="Venue">
          {sgEvent.venue_name ? `${sgEvent.venue_name}, ${sgEvent.venue_city}, ${sgEvent.venue_state}` : null}
        </Field>
      </Grid>
      <Grid size={2}>
        <Field label="Date">
          {sgEvent.local_date ? formatDateTime(moment.parseZone(sgEvent.local_date)) : null}
        </Field>
      </Grid>
      <Grid size={3}><Field label="Performer">{sgEvent.primary_performer_name}</Field></Grid>
    </Grid>
  ) : null;

  const PmFields = pmEvent ? (
    <Grid container spacing={1.5} columns={11}>
      <Grid size={1}>
        <Field label="Event ID">
          {pmHref
            ? <Link href={pmHref} target="_blank" rel="noopener noreferrer" underline="hover" color="primary">{pmEvent.id}</Link>
            : pmEvent.id}
        </Field>
      </Grid>
      <Grid size={2}><Field label="Name">{pmEvent.name}</Field></Grid>
      <Grid size={3}><Field label="Venue">{pmEvent.venue?.name}</Field></Grid>
      <Grid size={2}>
        <Field label="Date">
          {pmEvent.eventLocalDate ? formatDateTime(moment.parseZone(pmEvent.eventLocalDate)) : null}
        </Field>
      </Grid>
      <Grid size={2}><Field label="Performer">{pmEvent.performer?.name}</Field></Grid>
      <Grid size={1}><Field label="Market">{pmEvent.marketType}</Field></Grid>
    </Grid>
  ) : null;

  return (
    <Card variant="outlined">
      <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
        <Stack spacing={1.25} divider={<Divider />}>
          <PlatformRow
            logo="/seatgeek-logo.ico"
            title="SeatGeek"
            isVerified={mapping?.is_verified}
            loading={sgLoading}
            noMatch={!mappingLoading && mapping === null}
          >
            {SgFields}
          </PlatformRow>

          <PlatformRow
            logo="/tj-logo.ico"
            title="Primary Market"
            loading={availabilityFromRedux.loading && !pmEvent}
            noMatch={!availabilityFromRedux.loading && !pmEvent}
          >
            {PmFields}
          </PlatformRow>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default EventMappingCard;
