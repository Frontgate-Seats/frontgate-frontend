import * as React from "react";
import { Box, Stack, Typography, Skeleton, Divider } from "@mui/material";
import { ShoppingCart, TrendingUp, TrendingDown } from "@mui/icons-material";
import supabaseClient from "../../clients/supabase.client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventorySummary {
  total: number;
  totalInvested: number;
  totalTickets: number;
  futureEvents: number;
  pastEvents: number;
  available: number;
  onHold: number;
  depleted: number;
  partialSold: number;
  unsold: number;
  totalProfit: number;
  roi: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  const abs = Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n < 0 ? `-$${abs}` : `$${abs}`;
}

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function plColor(n: number) {
  return n >= 0 ? "#2e7d32" : "#c62828";
}

// ─── Big stat ─────────────────────────────────────────────────────────────────

function BigStat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <Box>
      <Typography
        variant="h6"
        fontWeight={700}
        lineHeight={1.15}
        sx={{ color: valueColor ?? "text.primary", fontSize: "1.15rem" }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── Meta row ─────────────────────────────────────────────────────────────────

function MetaRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}:
      </Typography>
      <Typography
        variant="caption"
        fontWeight={700}
        sx={{ color: valueColor ?? "text.primary" }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

// ─── Status row ───────────────────────────────────────────────────────────────

function StatusRow({
  dot,
  label,
  count,
  countColor,
}: {
  dot: string;
  label: string;
  count: number;
  countColor?: string;
}) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Box
          sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: dot, flexShrink: 0 }}
        />
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="caption"
        fontWeight={700}
        sx={{ color: countColor ?? "text.primary", minWidth: 20, textAlign: "right" }}
      >
        {count}
      </Typography>
    </Stack>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function Card({
  title,
  accentColor,
  bgColor,
  icon,
  children,
}: {
  title: string;
  accentColor: string;
  bgColor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        flex: "1 1 0",
        minWidth: 210,
        bgcolor: bgColor,
        borderRadius: 2,
        borderLeft: `4px solid ${accentColor}`,
        px: 1,
        py: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* watermark */}
      <Box
        sx={{
          position: "absolute",
          right: 6,
          bottom: 4,
          opacity: 0.07,
          display: "flex",
          pointerEvents: "none",
        }}
      >
        {icon}
      </Box>

      <Typography
        variant="caption"
        fontWeight={700}
        sx={{
          color: accentColor,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontSize: "0.67rem",
          mb: 1,
        }}
      >
        {title}
      </Typography>

      {children}
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PurchaseSummaryBar() {
  const [s, setS] = React.useState<InventorySummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabaseClient
      .rpc("get_inventory_summary")
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return; }

        const d = data as any;
        const totalInvested = Number(d.totalInvested ?? 0);
        const totalProfit   = Number(d.totalProfit   ?? 0);

        setS({
          total:         Number(d.total        ?? 0),
          totalInvested,
          totalProfit,
          totalTickets:  Number(d.totalTickets  ?? 0),
          futureEvents:  Number(d.futureEvents  ?? 0),
          pastEvents:    Number(d.pastEvents    ?? 0),
          available:     Number(d.available     ?? 0),
          onHold:        Number(d.onHold        ?? 0),
          depleted:      Number(d.depleted      ?? 0),
          partialSold:   Number(d.partialSold   ?? 0),
          unsold:        Number(d.unsold        ?? 0),
          roi: totalInvested > 0 ? (totalProfit / totalInvested) * 100 : null,
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <Skeleton variant="rounded" height={140} sx={{ flex: "1 1 0", minWidth: 210, borderRadius: 2 }} />
      </Stack>
    );
  }

  if (!s) return null;

  const profitAccent = s.totalProfit >= 0 ? "#2e7d32" : "#c62828";
  const profitBg     = s.totalProfit >= 0 ? "rgba(46,125,50,0.08)" : "rgba(198,40,40,0.07)";

  return (
    <Box sx={{ mb: 2 }}>
      <Card
        title="Portfolio"
        accentColor="#1565c0"
        bgColor="rgba(21,101,192,0.07)"
        icon={<ShoppingCart sx={{ fontSize: 60 }} />}
      >
        <Stack direction="row" alignItems="flex-start" spacing={0}>

          {/* ── Col 1: purchase counts ── */}
          <Stack spacing={0.75} sx={{ flex: 1, px: 2 }}>
            <Stack direction="row" spacing={3}>
              <BigStat label="Total Purchases" value={s.total} />
              <BigStat label="Total Tickets"   value={s.totalTickets} />
            </Stack>
            <Divider sx={{ my: 0.25, opacity: 0.35 }} />
            <MetaRow label="Total invested" value={fmtMoney(s.totalInvested)} />
            <Stack direction="row" spacing={2}>
              <MetaRow label="Future events" value={s.futureEvents} valueColor="#00695c" />
              <MetaRow label="Past events"   value={s.pastEvents} />
            </Stack>
          </Stack>

          {/* ── Vertical divider ── */}
          <Divider orientation="vertical" flexItem />

          {/* ── Col 2: P&L ── */}
          <Stack spacing={0.75} sx={{ flex: 1, px: 2 }}>
            <Stack direction="row" spacing={3}>
              <BigStat
                label="Net P&L"
                value={fmtMoney(s.totalProfit)}
                valueColor={plColor(s.totalProfit)}
              />
              <BigStat
                label="ROI"
                value={s.roi != null ? fmtPct(s.roi) : "—"}
                valueColor={s.roi != null ? plColor(s.roi) : undefined}
              />
            </Stack>
            <Divider sx={{ my: 0.25, opacity: 0.35 }} />
            <Box
              sx={{
                display: "inline-flex",
                alignSelf: "flex-start",
                alignItems: "center",
                gap: 0.5,
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                bgcolor: profitBg,
                border: "1px solid",
                borderColor: profitAccent + "55",
              }}
            >
              {s.totalProfit >= 0
                ? <TrendingUp sx={{ fontSize: 14, color: profitAccent }} />
                : <TrendingDown sx={{ fontSize: 14, color: profitAccent }} />
              }
              <Typography variant="caption" sx={{ color: profitAccent, fontWeight: 600 }}>
                {s.totalProfit >= 0 ? "Profitable" : "In Loss"}
              </Typography>
            </Box>
          </Stack>

          {/* ── Vertical divider ── */}
          <Divider orientation="vertical" flexItem />

          {/* ── Col 3: status breakdown ── */}
          <Stack spacing={0.4} sx={{ flex: 1, px: 2 }}>
            <StatusRow dot="#1e88e5" label="Available"    count={s.available} />
            <StatusRow dot="#fb8c00" label="On Hold"      count={s.onHold} />
            <StatusRow dot="#2e7d32" label="Sold"         count={s.depleted} />
            <StatusRow dot="#8e24aa" label="Partial Sold" count={s.partialSold} />
            <StatusRow
              dot="#c62828"
              label="Unsold"
              count={s.unsold}
              countColor={s.unsold > 0 ? "#c62828" : undefined}
            />
          </Stack>

        </Stack>
      </Card>
    </Box>
  );
}
