import { useState, useCallback } from 'react';
import { Grid, Stack } from '@mui/material';
import type { DateRange } from '../types/dashboard.types';
import { resolveDateRange } from '../shared/utils/timeRange.util';
import DashboardFilter from '../components/dashboard/DashboardFilter';
import InventoryCards from '../components/dashboard/InventoryCards';
import ChartRenderer from '../components/dashboard/ChartRenderer';
import PurchasesTable from '../components/dashboard/PurchasesTable';
import SalesTable from '../components/dashboard/SalesTable';

export default function DashboardPage() {
  // Default = Last 7 Days — uses the shared resolver for midnight boundaries.
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(
    () => resolveDateRange('7d'),
  );

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setSelectedDateRange(range);
  }, []);

  return (
    <Stack
      padding={3}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {/* Filters accordion (open by default) with the time-range filter */}
      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12 }}>
          <DashboardFilter
            onDateRangeChange={handleDateRangeChange}
            initialFilter="7d"
          />
        </Grid>
      </Grid>

      {/* ── Row 1: Cards (2×2) on the left, combined chart on the right ── */}
      <Grid container spacing={3} mt={4} mb={4} alignItems="stretch">
        {/* Left: four summary cards in a 2×2 grid */}
        <Grid size={{ xs: 12, md: 6 }}>
          <InventoryCards dateRange={selectedDateRange} direction="column" />
        </Grid>
        {/* Right: purchases + sales combined — fills the cards' height */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", minWidth: 0 }}>
          <ChartRenderer dateRange={selectedDateRange} fill />
        </Grid>
      </Grid>

      {/* ── Row 3: Tables 50 / 50 ── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PurchasesTable dateRange={selectedDateRange} pageSize={25} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SalesTable dateRange={selectedDateRange} pageSize={25} />
        </Grid>
      </Grid>
    </Stack>
  );
}
