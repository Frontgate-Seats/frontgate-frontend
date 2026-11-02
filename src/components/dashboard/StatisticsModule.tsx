/**
 * StatisticsModule Component
 * 
 * Displays three aggregate financial metrics at the top of the dashboard:
 * - Total Invested: Sum of all total_amount from inventory table
 * - Active Unsold: Sum of total_amount for available inventory with future event dates
 * - Total Sales: Sum of all sale_total from sold_inventory table
 * 
 * Requirements Coverage:
 * - 2.1: Display three horizontally arranged statistics boxes
 * - 2.2: Compute Total Invested from all inventory records
 * - 2.3: Compute Active Unsold from Active_Unsold_Inventory records
 * - 2.4: Compute Total Sales from all sold_inventory records
 * - 2.5: Format monetary values with two decimals and currency symbol
 * - 2.6: Refresh values when database changes (within 5 seconds)
 * - 18.1: Display loading spinners while fetching data
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  Inventory2,
  AttachMoney,
} from '@mui/icons-material';
import type {
  Statistics,
  StatisticsModuleProps,
} from '../../types/dashboard.types';
import supabaseClient from '../../clients/supabase.client';

/**
 * StatisticsModule Component
 * 
 * Fetches and displays three key financial metrics with automatic refresh
 * when database data changes.
 */
export default function StatisticsModule({ dateRange }: StatisticsModuleProps) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Formats monetary values with currency symbol and two decimal places
   * Requirement 2.5: Format monetary values with currency symbol
   */
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  /**
   * Fetches aggregate statistics from database
   * Requirements 2.2, 2.3, 2.4
   */
  const fetchStatistics = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Requirement 2.2: Calculate Total Invested
      // Sum of all total_amount from inventory table
      const { data: totalInvestedData, error: totalInvestedError } = await supabaseClient
        .from('inventory')
        .select('total_amount');

      if (totalInvestedError) {
        throw new Error(`Error fetching total invested: ${totalInvestedError.message}`);
      }

      const totalInvested = (totalInvestedData || []).reduce(
        (sum, record) => sum + parseFloat(record.total_amount || '0'),
        0
      );

      // Requirement 2.3: Calculate Active Unsold
      // Sum of total_amount where inventory_status='Available' AND event_utc_date >= NOW()
      const now = new Date().toISOString();
      const { data: activeUnsoldData, error: activeUnsoldError } = await supabaseClient
        .from('inventory')
        .select('total_amount')
        .eq('inventory_status', 'Available')
        .gte('event_utc_date', now);

      if (activeUnsoldError) {
        throw new Error(`Error fetching active unsold: ${activeUnsoldError.message}`);
      }

      const activeUnsold = (activeUnsoldData || []).reduce(
        (sum, record) => sum + parseFloat(record.total_amount || '0'),
        0
      );

      // Requirement 2.4: Calculate Total Sales
      // Sum of all sale_total from sold_inventory table
      const { data: totalSalesData, error: totalSalesError } = await supabaseClient
        .from('sold_inventory')
        .select('sale_total');

      if (totalSalesError) {
        throw new Error(`Error fetching total sales: ${totalSalesError.message}`);
      }

      const totalSales = (totalSalesData || []).reduce(
        (sum, record) => sum + parseFloat(record.sale_total || '0'),
        0
      );

      // Set statistics
      setStatistics({
        totalInvested,
        activeUnsold,
        totalSales,
      });
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Unable to load statistics. Please try again later.');
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch statistics on component mount and when dateRange changes
   */
  useEffect(() => {
    fetchStatistics();
  }, [dateRange, fetchStatistics]);

  /**
   * Subscribe to database changes for real-time updates
   * Requirement 2.6: Refresh values when database changes (within 5 seconds)
   */
  useEffect(() => {
    // Subscribe to inventory table changes
    const inventorySubscription = supabaseClient
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
        },
        () => {
          // Refresh statistics when inventory changes
          fetchStatistics();
        }
      )
      .subscribe();

    // Subscribe to sold_inventory table changes
    const soldInventorySubscription = supabaseClient
      .channel('sold-inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sold_inventory',
        },
        () => {
          // Refresh statistics when sold_inventory changes
          fetchStatistics();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      inventorySubscription.unsubscribe();
      soldInventorySubscription.unsubscribe();
    };
  }, [fetchStatistics]);

  // Requirement 19.1: Display error message
  if (error) {
    return (
      <Box mb={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box mb={4}>
      {/* Requirement 2.1: Three horizontally arranged statistics boxes */}
      <Grid container spacing={3}>
        {/* Total Invested Statistics Box */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Total Invested
                </Typography>
              </Box>
              {/* Requirement 18.1: Display loading spinners while fetching */}
              {isLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {statistics ? formatCurrency(statistics.totalInvested) : '$0.00'}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" mt={1}>
                Sum of all inventory purchases
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Unsold Statistics Box */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Inventory2 color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Active Unsold
                </Typography>
              </Box>
              {/* Requirement 18.1: Display loading spinners while fetching */}
              {isLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {statistics ? formatCurrency(statistics.activeUnsold) : '$0.00'}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" mt={1}>
                Available inventory with future events
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Sales Statistics Box */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AttachMoney color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Total Sales
                </Typography>
              </Box>
              {/* Requirement 18.1: Display loading spinners while fetching */}
              {isLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {statistics ? formatCurrency(statistics.totalSales) : '$0.00'}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" mt={1}>
                Total revenue from sold tickets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
