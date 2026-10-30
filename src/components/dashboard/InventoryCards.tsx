/**
 * InventoryCards Component
 *
 * Displays three summary cards at the top of the dashboard using direct
 * Supabase queries — no helper functions.
 *
 * Cards:
 *  - Total Invested  : SUM(total_amount) from inventory
 *  - Active Unsold   : SUM(total_amount) from inventory WHERE status='Available' AND event_utc_date >= NOW()
 *  - Total Sales     : SUM(sale_total) from sold_inventory
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import supabaseClient from '../../clients/supabase.client';
import type { DateRange } from '../../types/dashboard.types';

interface InventoryCardsProps {
  dateRange: DateRange;
}

interface CardData {
  totalInvested: number;
  activeUnsold: number;
  totalSales: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export default function InventoryCards({ dateRange }: InventoryCardsProps) {
  const [data, setData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        // Total Invested — all inventory records (not date-filtered, global stat)
        const { data: invRows, error: invErr } = await supabaseClient
          .from('inventory')
          .select('total_amount');
        if (invErr) throw invErr;

        const totalInvested = (invRows ?? []).reduce(
          (sum, r) => sum + parseFloat(r.total_amount ?? '0'),
          0,
        );

        // Active Unsold — available inventory with future event dates
        const { data: unsoldRows, error: unsoldErr } = await supabaseClient
          .from('inventory')
          .select('total_amount')
          .eq('inventory_status', 'Available')
          .gte('event_utc_date', new Date().toISOString());
        if (unsoldErr) throw unsoldErr;

        const activeUnsold = (unsoldRows ?? []).reduce(
          (sum, r) => sum + parseFloat(r.total_amount ?? '0'),
          0,
        );

        // Total Sales — all sold_inventory records (global stat)
        const { data: salesRows, error: salesErr } = await supabaseClient
          .from('sold_inventory')
          .select('sale_total');
        if (salesErr) throw salesErr;

        const totalSales = (salesRows ?? []).reduce(
          (sum, r) => sum + parseFloat(r.sale_total ?? '0'),
          0,
        );

        if (!cancelled) {
          setData({ totalInvested, activeUnsold, totalSales });
        }
      } catch (err) {
        console.error('InventoryCards fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [dateRange]);

  const cards = [
    {
      label: 'Total Invested',
      sub: 'Sum of all inventory purchases',
      value: data?.totalInvested ?? 0,
      color: 'primary.main',
      icon: <TrendingUpIcon fontSize="medium" color="primary" />,
    },
    {
      label: 'Active Unsold',
      sub: 'Available inventory with future events',
      value: data?.activeUnsold ?? 0,
      color: 'warning.main',
      icon: <Inventory2Icon fontSize="medium" color="warning" />,
    },
    {
      label: 'Total Sales',
      sub: 'Total revenue from sold tickets',
      value: data?.totalSales ?? 0,
      color: 'success.main',
      icon: <AttachMoneyIcon fontSize="medium" color="success" />,
    },
  ];

  return (
    <Grid container spacing={3} mb={4}>
      {cards.map((card) => (
        <Grid key={card.label} size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {card.icon}
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                  {card.label}
                </Typography>
              </Box>
              {loading ? (
                <Skeleton variant="text" width="70%" height={48} />
              ) : (
                <Typography variant="h5" fontWeight="bold" color={card.color}>
                  {fmt(card.value)}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {card.sub}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
