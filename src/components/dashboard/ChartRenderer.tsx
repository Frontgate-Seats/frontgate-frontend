/**
 * ChartRenderer Component
 *
 * Renders a dual-series line chart (count + amount) for purchases or sales
 * using the shared DynamicChart component.
 *
 * - Left Y-axis  : record count (# transactions)
 * - Right Y-axis : dollar amount ($)
 * - Missing dates are filled with zeros
 */

import { useState, useEffect, useCallback } from 'react';
import type { ChartRendererProps } from '../../types/dashboard.types';
import supabaseClient from '../../clients/supabase.client';
import DynamicChart from '../common/charts/DynamicChart';

interface DayBucket {
  time: string;   // YYYY-MM-DD — DynamicChart expects 'time' key
  count: number;
  amount: number;
}

export default function ChartRenderer({ dataType, dateRange }: ChartRendererProps) {
  const [dataset, setDataset] = useState<DayBucket[]>([]);
  const [loading, setLoading] = useState(false);

  const isP = dataType === 'purchases';

  /** Build an ordered list of every date (YYYY-MM-DD) within the range */
  const buildDateRange = useCallback((start: Date, end: Date): string[] => {
    const dates: string[] = [];
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const endD = new Date(end);
    endD.setHours(0, 0, 0, 0);
    while (cur <= endD) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const table      = isP ? 'inventory'      : 'sold_inventory';
      const dateCol    = isP ? 'created_at'      : 'invoice_date';
      const amountCol  = isP ? 'total_amount'    : 'sale_total';

      const { data, error } = await supabaseClient
        .from(table)
        .select(`${dateCol}, ${amountCol}`)
        .gte(dateCol, dateRange.startDate.toISOString())
        .lte(dateCol, dateRange.endDate.toISOString())
        .order(dateCol, { ascending: true });

      if (error) throw error;

      // Aggregate count + amount per calendar day
      const agg = new Map<string, { count: number; amount: number }>();
      (data ?? []).forEach((row) => {
        const rowAny = row as Record<string, string>;
        const key = rowAny[dateCol]?.split('T')[0];
        if (!key) return;
        const prev = agg.get(key) ?? { count: 0, amount: 0 };
        agg.set(key, {
          count:  prev.count + 1,
          amount: prev.amount + parseFloat(rowAny[amountCol] ?? '0'),
        });
      });

      // Fill every date in range — zeros for days with no activity
      const filled: DayBucket[] = buildDateRange(
        dateRange.startDate,
        dateRange.endDate,
      ).map((day) => ({
        time:   day,
        count:  agg.get(day)?.count  ?? 0,
        amount: agg.get(day)?.amount ?? 0,
      }));

      setDataset(filled);
    } catch (err) {
      console.error('ChartRenderer fetch error:', err);
      setDataset([]);
    } finally {
      setLoading(false);
    }
  }, [isP, dateRange, buildDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const countColor  = isP ? '#1976d2' : '#7b1fa2';
  const amountColor = isP ? '#0288d1' : '#2e7d32';
  const countLabel  = isP ? 'Purchase Count' : 'Sale Count';
  const amountLabel = isP ? 'Purchase Amount ($)' : 'Sale Amount ($)';

  return (
    <DynamicChart
      title={isP ? 'Purchase Trends' : 'Sale Trends'}
      dataset={dataset}
      loading={loading}
      height={360}
      chartConfig={{
        lineSeries: [
          {
            type: 'line',
            dataKey: 'count',
            label: countLabel,
            color: countColor,
            curve: 'linear',
            showMark: false,
            yAxisId: 'leftAxis',
          },
          {
            type: 'line',
            dataKey: 'amount',
            label: amountLabel,
            color: amountColor,
            curve: 'linear',
            showMark: false,
            yAxisId: 'rightAxis',
          },
        ],
        barSeries: [],
        leftAxisLabel:  isP ? 'Count'  : 'Count',
        rightAxisLabel: isP ? 'Amount ($)' : 'Amount ($)',
      }}
      timeRange="custom"
      interval=""
      onTimeRangeChange={() => {}}
      onIntervalChange={() => {}}
      timeRangeOptions={[]}
      intervalOptionsMap={{}}
    />
  );
}
