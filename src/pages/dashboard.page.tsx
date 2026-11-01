import { useState, useCallback } from 'react';
import { Container, Grid } from '@mui/material';
import type { DateRange } from '../types/dashboard.types';
import DashboardFilter from '../components/dashboard/DashboardFilter';
import InventoryCards from '../components/dashboard/InventoryCards';
import ChartRenderer from '../components/dashboard/ChartRenderer';
import PurchasesTable from '../components/dashboard/PurchasesTable';
import SalesTable from '../components/dashboard/SalesTable';

export default function DashboardPage() {
  // Default = Last 7 Days (calendar-based: from the start of the day 7 days ago,
  // matching SkyBox's "last N days" window).
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(() => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate: new Date() };
  });

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setSelectedDateRange(range);
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Filters accordion (open by default) with the time-range filter */}
      <DashboardFilter
        onDateRangeChange={handleDateRangeChange}
        initialFilter="7d"
      />

      {/* ── Row 1: Cards (2×2) on the left, combined chart on the right ── */}
      <Grid container spacing={3} mt={4} mb={4} alignItems="stretch">
        {/* Left: four summary cards in a 2×2 grid */}
        <Grid size={{ xs: 12, md: 6 }}>
          <InventoryCards dateRange={selectedDateRange} direction="column" />
        </Grid>
        {/* Right: purchases + sales combined — fills the cards' height */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', minWidth: 0 }}>
          <ChartRenderer dateRange={selectedDateRange} fill />
        </Grid>
      </Grid>

      {/* ── Row 3: Tables 50 / 50 ── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PurchasesTable dateRange={selectedDateRange} pageSize={50} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SalesTable dateRange={selectedDateRange} pageSize={50} />
        </Grid>
      </Grid>
    </Container>
  );
}
