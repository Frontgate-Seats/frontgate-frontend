/**
 * InventoryCards Component
 *
 * Four summary cards styled and populated to match the inventory page's
 * PurchaseSummaryBar. Data comes from the shared `get_inventory_summary`
 * RPC so the numbers stay consistent with the inventory page.
 *
 * Cards:
 *  1. Total        — all purchases: Purchases / Invested / Sell + status chips
 *  2. Active Unsold — available inventory for future events + status chips
 *  3. Active       — future events: Purchases / Invested / Sell + status chips
 *  4. P&L          — Net P&L + Margin % with Profitable/In Loss badge
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Chip,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ConfirmationNumberOutlined,
  Circle,
  Inventory2Outlined,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import type { AppDispatch, RootState } from '../../store';
import { getInventorySummary } from '../../store/slices/dashboard.slice';
import type { DateRange } from '../../types/dashboard.types';

interface InventoryCardsProps {
  dateRange: DateRange;
  /** 'row' = cards side by side (default), 'column' = 2×2 grid */
  direction?: 'row' | 'column';
}

// ─── Helpers (mirror PurchaseSummaryBar) ────────────────────────────────────
function fmtMoney(n: number) {
  const abs = Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n < 0 ? `-$${abs}` : `$${abs}`;
}

function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

function plColor(n: number) {
  return n >= 0 ? '#2e7d32' : '#c62828';
}

// ─── Big stat ───────────────────────────────────────────────────────────────
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
      sx={hint ? { borderBottom: '1px dotted', borderColor: 'text.disabled', cursor: 'help', display: 'inline' } : undefined}
    >
      {label}
    </Typography>
  );
  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ color: valueColor ?? 'text.primary' }}>
        {value}
      </Typography>
      {hint ? <Tooltip title={hint} arrow>{labelNode}</Tooltip> : labelNode}
    </Box>
  );
}

// ─── Status chip ─────────────────────────────────────────────────────────────
function StatusChip({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      label={`${label}: ${count}`}
      sx={{
        color,
        borderColor: color + '66',
        bgcolor: color + '14',
        fontWeight: 600,
        '& .MuiChip-label': { color },
      }}
    />
  );
}

// ─── P&L badge ───────────────────────────────────────────────────────────────
function PnLBadge({ profit }: { profit: number }) {
  const up = profit >= 0;
  return (
    <Chip
      size="small"
      variant="outlined"
      color={up ? 'success' : 'error'}
      icon={up ? <TrendingUp /> : <TrendingDown />}
      label={up ? 'Profitable' : 'In Loss'}
    />
  );
}

// ─── Card shell ──────────────────────────────────────────────────────────────
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
        flex: '1 1 0',
        width: '100%',
        height: '100%',
        bgcolor: accentColor + '0D',
        borderRadius: 2,
        border: '1px solid',
        borderColor: accentColor + '26',
        borderLeft: `4px solid ${accentColor}`,
        px: 2.5,
        py: 1.75,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: 1.25,
              bgcolor: accentColor + '1A',
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontSize: '0.72rem',
                display: 'block',
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.1 }}>
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

export default function InventoryCards({ dateRange, direction = 'row' }: InventoryCardsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { summary: s, summaryLoading } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    dispatch(getInventorySummary());
  }, [dispatch, dateRange]);

  const loading = summaryLoading;
  // Overall margin (Net P&L ÷ total Sale), mirroring the inventory summary bar.
  const totalMargin = s && s.totalSold > 0 ? (s.totalProfit / s.totalSold) * 100 : null;

  const isColumn = direction === 'column';
  // Column mode (left of chart): 2×2 grid. Row mode: 4-up on desktop.
  const cellSize = isColumn ? { xs: 12, sm: 6 } : { xs: 12, sm: 6, md: 3 };

  if (loading || !s) {
    return (
      <Grid container spacing={2} sx={{ height: isColumn ? '100%' : 'auto', mb: isColumn ? 0 : 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} size={cellSize} sx={{ display: 'flex' }}>
            <Skeleton variant="rounded" width="100%" height={176} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={2} sx={{ height: isColumn ? '100%' : 'auto', mb: isColumn ? 0 : 4 }}>
      {/* ══ Card 1: Total ══ */}
      <Grid size={cellSize} sx={{ display: 'flex' }}>
        <Card
          title="Total"
          subtitle="All purchases"
          accentColor="#1565c0"
          icon={<ConfirmationNumberOutlined sx={{ fontSize: 17 }} />}
        >
          <Stack direction="row" spacing={2} mt={1} divider={<Divider orientation="vertical" flexItem />}>
            <BigStat label="Purchases" value={s.uniquePurchases} hint="Number of distinct purchases made." />
            <BigStat label="Invested" value={fmtMoney(s.totalInvested)} hint="Total amount spent buying tickets." />
            <BigStat label="Sell" value={fmtMoney(s.totalSold)} valueColor="#2e7d32" hint="Total revenue from tickets sold so far." />
          </Stack>

          <Divider sx={{ mt: 2, mb: 2 }} />
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <StatusChip color="#1b5e20" label="Sold"         count={s.depleted} />
            <StatusChip color="#2e7d32" label="Partial Sold" count={s.partialSold} />
            <StatusChip color="#1565c0" label="Available"    count={s.available} />
            <StatusChip color="#f57c00" label="On Hold"      count={s.onHold} />
            <StatusChip color="#c62828" label="Unsold"       count={s.unsold} />
          </Stack>
        </Card>
      </Grid>

      {/* ══ Card 2: Active Unsold ══ */}
      <Grid size={cellSize} sx={{ display: 'flex' }}>
        <Card
          title="Active Unsold"
          subtitle="Available inventory, future events"
          accentColor="#f57c00"
          icon={<Inventory2Outlined sx={{ fontSize: 16 }} />}
        >
          <Stack direction="row" spacing={2} mt={1} divider={<Divider orientation="vertical" flexItem />}>
            <BigStat label="Items" value={s.activeAvailable} hint="Available inventory records for upcoming events." />
            <BigStat label="Invested" value={fmtMoney(s.activeAvailableInvested)} hint="Amount spent on available (unsold) tickets for upcoming events." />
          </Stack>

          <Divider sx={{ mt: 2, mb: 2 }} />
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <StatusChip color="#1565c0" label="Available"    count={s.activeAvailable} />
            <StatusChip color="#2e7d32" label="Partial Sold" count={s.activePartialSold} />
            <StatusChip color="#f57c00" label="On Hold"      count={s.activeOnHold} />
          </Stack>
        </Card>
      </Grid>

      {/* ══ Card 3: Active (future events) ══ */}
      <Grid size={cellSize} sx={{ display: 'flex' }}>
        <Card
          title="Active"
          subtitle="Upcoming events"
          accentColor="#2e7d32"
          icon={<Circle sx={{ fontSize: 12 }} />}
        >
          <Stack direction="row" spacing={2} mt={1} divider={<Divider orientation="vertical" flexItem />}>
            <BigStat label="Purchases" value={s.activeItems} hint="Purchases for events that haven't happened yet." />
            <BigStat label="Invested" value={fmtMoney(s.activeInvested)} hint="Amount spent on upcoming-event tickets." />
            <BigStat label="Sell" value={fmtMoney(s.activeSold)} valueColor="#2e7d32" hint="Revenue from upcoming-event tickets sold so far." />
          </Stack>

          <Divider sx={{ mt: 2, mb: 2 }} />
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <StatusChip color="#1b5e20" label="Sold"         count={s.activeDepleted} />
            <StatusChip color="#2e7d32" label="Partial Sold" count={s.activePartialSold} />
            <StatusChip color="#1565c0" label="Available"    count={s.activeAvailable} />
            <StatusChip color="#f57c00" label="On Hold"      count={s.activeOnHold} />
          </Stack>
        </Card>
      </Grid>

      {/* ══ Card 4: P&L ══ */}
      <Grid size={cellSize} sx={{ display: 'flex' }}>
        <Card
          title="P&L"
          subtitle="Overall performance"
          accentColor={s.totalProfit >= 0 ? '#2e7d32' : '#c62828'}
          icon={s.totalProfit >= 0 ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
          badge={<PnLBadge profit={s.totalProfit} />}
        >
          <Stack direction="row" justifyContent="space-around" alignItems="center" spacing={2} sx={{ flex: 1, mt: 1 }}>
            <Tooltip title="Total profit or loss across the whole book: realized gains/losses on sold tickets, plus the full cost of unsold tickets written off as a loss." arrow>
              <Box sx={{ textAlign: 'center', cursor: 'help' }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: plColor(s.totalProfit) }}>
                  {fmtMoney(s.totalProfit)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ borderBottom: '1px dotted', borderColor: 'text.disabled', display: 'inline' }}>
                  Net P&amp;L
                </Typography>
              </Box>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Return on investment = total Net P&L ÷ total Sale (Skybox margin calculation)." arrow>
              <Box sx={{ textAlign: 'center', cursor: 'help' }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: totalMargin != null ? plColor(totalMargin) : 'text.primary' }}>
                  {totalMargin != null ? fmtPct(totalMargin) : '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ borderBottom: '1px dotted', borderColor: 'text.disabled', display: 'inline' }}>
                  Margin %
                </Typography>
              </Box>
            </Tooltip>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}
