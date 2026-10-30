import { useState, useCallback } from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import type { DateRange } from '../types/dashboard.types';
import DateFilter from '../components/dashboard/DateFilter';
import InventoryCards from '../components/dashboard/InventoryCards';
import ChartRenderer from '../components/dashboard/ChartRenderer';
import PurchasesTable from '../components/dashboard/PurchasesTable';
import SalesTable from '../components/dashboard/SalesTable';

export default function DashboardPage() {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate:   new Date(),
  });

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setSelectedDateRange(range);
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Financial analytics and operational oversight for ticket inventory management
      </Typography>

      {/* Date filter */}
      <DateFilter
        onDateRangeChange={handleDateRangeChange}
        initialFilter="last7days"
      />

      {/* ── Row 1: Inventory summary cards ── */}
      <Box mt={3}>
        <InventoryCards dateRange={selectedDateRange} />
      </Box>

      {/* ── Row 2: Charts 50 / 50 ── */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartRenderer dataType="purchases" dateRange={selectedDateRange} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartRenderer dataType="sales" dateRange={selectedDateRange} />
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
