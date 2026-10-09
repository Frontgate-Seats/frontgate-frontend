import * as React from "react";
import { Box, Stack, Typography, Skeleton, Chip, Tooltip, Divider } from "@mui/material";
import {
  ConfirmationNumberOutlined,
  Circle,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";
import supabaseClient from "../../clients/supabase.client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioSummary {
  // Totals — all purchases
  uniquePurchases: number;
  totalInvested: number;
  totalSold: number;
  totalProfit: number;
  totalRoi: number | null;

  // Total status breakdown
  available: number;
  onHold: number;
  depleted: number;
  partialSold: number;
  unsold: number;

  // Active — future events only (event_utc_date > NOW())
  activeItems: number;
  activeInvested: number;
  activeSold: number;
  activeProfit: number;
  activeRoi: number | null;

  // Active status breakdown
  activeAvailable: number;
  activeOnHold: number;
  activeDepleted: number;
  activePartialSold: number;
  activeUnsold: number;
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
  hint,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
  hint?: string;
}) {
  const labelNode = (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={hint ? { borderBottom: "1px dotted", borderColor: "text.disabled", cursor: "help", display: "inline" } : undefined}
    >
      {label}
    </Typography>
  );
  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ color: valueColor ?? "text.primary" }}>
        {value}
      </Typography>
      {hint ? <Tooltip title={hint} arrow>{labelNode}</Tooltip> : labelNode}
    </Box>
  );
}


function StatusChip({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <Chip
      size="small"
      variant="outlined"
      label={`${label}: ${count}`}
      sx={{
        color,
        borderColor: color + "66",
        bgcolor: color + "14",
        fontWeight: 600,
        "& .MuiChip-label": { color },
      }}
    />
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  accentColor,
  icon,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  accentColor: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        flex: "1 1 0",
        minWidth: 340,
        bgcolor: accentColor + "0D",
        borderRadius: 2,
        border: "1px solid",
        borderColor: accentColor + "26",
        borderLeft: `4px solid ${accentColor}`,
        px: 2.5,
        py: 1.75,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* header: icon pill + title (left), badge (right) */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: 1.25,
              bgcolor: accentColor + "1A",
              color: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{
                color: accentColor,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                fontSize: "0.72rem",
                display: "block",
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {badge}
      </Stack>

      {children}
    </Box>
  );
}

// ─── P&L badge ──────────────────────────────────────────────────────────────

function PnLBadge({ profit }: { profit: number }) {
  const up = profit >= 0;
  return (
    <Chip
      size="small"
      variant="outlined"
      color={up ? "success" : "error"}
      icon={up ? <TrendingUp /> : <TrendingDown />}
      label={up ? "Profitable" : "In Loss"}
    />
  );
}


// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PurchaseSummaryBar() {
  const [s, setS] = React.useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabaseClient
      .rpc("get_inventory_summary")
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return; }

        const d = data as any;
        const totalInvested  = Number(d.totalInvested  ?? 0);
        const totalProfit    = Number(d.totalProfit    ?? 0);
        const activeInvested = Number(d.activeInvested ?? 0);
        const activeProfit   = Number(d.activeProfit   ?? 0);

        setS({
          // Totals
          uniquePurchases: Number(d.uniquePurchases ?? d.total ?? 0),
          totalInvested,
          totalSold:      Number(d.totalSold ?? 0),
          totalProfit,
          totalRoi: totalInvested > 0 ? (totalProfit / totalInvested) * 100 : null,

          // Total status
          available:      Number(d.available       ?? 0),
          onHold:         Number(d.onHold          ?? 0),
          depleted:       Number(d.depleted        ?? 0),
          partialSold:    Number(d.partialSold     ?? 0),
          unsold:         Number(d.unsold          ?? 0),

          // Active (future)
          activeItems:    Number(d.activeItems     ?? 0),
          activeInvested,
          activeSold:     Number(d.activeSold ?? 0),
          activeProfit,
          activeRoi: activeInvested > 0 ? (activeProfit / activeInvested) * 100 : null,

          // Active status
          activeAvailable:   Number(d.activeAvailable   ?? 0),
          activeOnHold:      Number(d.activeOnHold      ?? 0),
          activeDepleted:    Number(d.activeDepleted    ?? 0),
          activePartialSold: Number(d.activePartialSold ?? 0),
          activeUnsold:      Number(d.activeUnsold      ?? 0),
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rounded" height={170} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!s) return null;

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={{ mb: 2 }}
      alignItems="stretch"
    >
      {/* ══ Card 1: Total ══════════════════════════════════════════════════════ */}
      <Card
        title="Total"
        subtitle="All purchases"
        accentColor="#1565c0"
        icon={<ConfirmationNumberOutlined sx={{ fontSize: 17 }} />}
      >
        <Stack
          direction="row"
          spacing={2}
          mt={1}
          divider={<Divider orientation="vertical" flexItem />}
        >
          <BigStat
            label="Purchases"
            value={s.uniquePurchases}
            hint="Number of distinct purchases made."
          />
          <BigStat
            label="Invested"
            value={fmtMoney(s.totalInvested)}
            hint="Total amount spent buying tickets."
          />
          <BigStat
            label="Sell"
            value={fmtMoney(s.totalSold)}
            valueColor="#2e7d32"
            hint="Total revenue from tickets sold so far."
          />
        </Stack>

        <Divider sx={{ mt: 2, mb: 2 }} />
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <StatusChip color="#1b5e20" label="Sold"         count={s.depleted} />
          <StatusChip color="#2e7d32" label="Partial Sold" count={s.partialSold} />
          <StatusChip color="#1565c0" label="Available"    count={s.available} />
          <StatusChip color="#f57c00" label="On Hold"      count={s.onHold} />
          <StatusChip color="#c62828" label="Unsold"       count={s.unsold} />
        </Stack>
      </Card>

      {/* ══ Card 2: Active (future events) ═════════════════════════════════════ */}
      <Card
        title="Active"
        subtitle="Upcoming events"
        accentColor="#2e7d32"
        icon={<Circle sx={{ fontSize: 12 }} />}
      >
        <Stack
          direction="row"
          spacing={2}
          mt={1}
          divider={<Divider orientation="vertical" flexItem />}
        >
          <BigStat
            label="Purchases"
            value={s.activeItems}
            hint="Purchases for events that haven't happened yet."
          />
          <BigStat
            label="Invested"
            value={fmtMoney(s.activeInvested)}
            hint="Amount spent on upcoming-event tickets."
          />
          <BigStat
            label="Sell"
            value={fmtMoney(s.activeSold)}
            valueColor="#2e7d32"
            hint="Revenue from upcoming-event tickets sold so far."
          />
        </Stack>

        <Divider sx={{ mt: 2, mb: 2 }} />
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <StatusChip color="#1b5e20" label="Sold"         count={s.activeDepleted} />
          <StatusChip color="#2e7d32" label="Partial Sold" count={s.activePartialSold} />
          <StatusChip color="#1565c0" label="Available"    count={s.activeAvailable} />
          <StatusChip color="#f57c00" label="On Hold"      count={s.activeOnHold} />
          <StatusChip color="#c62828" label="Unsold"       count={s.activeUnsold} />
        </Stack>
      </Card>

      {/* ══ Card 3: P&L ════════════════════════════════════════════════════════ */}
      <Card
        title="P&L"
        subtitle="Overall performance"
        accentColor={s.totalProfit >= 0 ? "#2e7d32" : "#c62828"}
        icon={s.totalProfit >= 0 ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
        badge={<PnLBadge profit={s.totalProfit} />}
      >
        <Stack
          direction="row"
          justifyContent="space-around"
          alignItems="center"
          spacing={2}
          sx={{ flex: 1, mt: 1 }}
        >
          <Tooltip title="Total profit or loss across the whole book: realized gains/losses on sold tickets, plus the full cost of unsold tickets written off as a loss." arrow>
            <Box sx={{ textAlign: "center", cursor: "help" }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: plColor(s.totalProfit) }}>
                {fmtMoney(s.totalProfit)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ borderBottom: "1px dotted", borderColor: "text.disabled", display: "inline" }}
              >
                Net P&amp;L
              </Typography>
            </Box>
          </Tooltip>
          <Divider orientation="vertical" flexItem />
          <Tooltip title="Return on investment = total Net P&L ÷ total Invested (all purchases)." arrow>
            <Box sx={{ textAlign: "center", cursor: "help" }}>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: s.totalRoi != null ? plColor(s.totalRoi) : "text.primary" }}
              >
                {s.totalRoi != null ? fmtPct(s.totalRoi) : "—"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ borderBottom: "1px dotted", borderColor: "text.disabled", display: "inline" }}
              >
                ROI
              </Typography>
            </Box>
          </Tooltip>
        </Stack>
      </Card>
    </Stack>
  );
}
