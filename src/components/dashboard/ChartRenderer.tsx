/**
 * ChartRenderer Component
 *
 * Combined purchases + sales trend chart. Three lines (Purchase / Sold / Profit) plotted
 * by dollar amount; each point's tooltip also carries the day's quantity.
 * Data comes from the dashboard slice (getDashboardChart) — no direct DB access.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { ChartRendererProps } from '../../types/dashboard.types';
import type { AppDispatch, RootState } from '../../store';
import { getDashboardChart } from '../../store/slices/dashboard.slice';
import DynamicChart from '../common/charts/DynamicChart';

export default function ChartRenderer({ dateRange, fill = false }: ChartRendererProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { chart: dataset, chartLoading: loading } = useSelector(
    (state: RootState) => state.dashboard,
  );

  useEffect(() => {
    dispatch(getDashboardChart(dateRange));
  }, [dispatch, dateRange]);

  // Money + count formatters for tooltips
  const money = (v: number | null) =>
    v == null
      ? '-'
      : `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  // Tooltip shows the day's total ($) AND quantity (count) for that line.
  // For the legend, just show the plain label (no per-point value).
  const makeComboFormatter = (countKey: 'purchaseCount' | 'saleCount') =>
    (value: number | null, ctx: { dataIndex?: number; location?: string } = {}) => {
      if (value == null) return '-';
      if (ctx.location === 'legend') return money(value);
      const idx = ctx.dataIndex;
      const qty = idx != null ? (dataset[idx]?.[countKey] as number | undefined) : undefined;
      return qty != null ? `${money(value)} · Qty ${qty}` : money(value);
    };

  // Two lines (Purchase + Sold by amount); tooltip carries qty too.
  // 'natural' curve = smooth waves, showMark: true = dots on every point.
  const lineSeries = [
    {
      type: 'line' as const,
      dataKey: 'purchaseAmount',
      label: 'Purchase',
      color: '#0288d1',
      curve: 'natural' as const,
      showMark: true,
      yAxisId: 'leftAxis',
      valueFormatter: makeComboFormatter('purchaseCount'),
    },
    {
      type: 'line' as const,
      dataKey: 'saleAmount',
      label: 'Sold',
      color: '#2e7d32',
      curve: 'natural' as const,
      showMark: true,
      yAxisId: 'leftAxis',
      valueFormatter: makeComboFormatter('saleCount'),
    },
    {
      // Profit from tickets SOLD that day (same basis as the Sales table Profit).
      type: 'line' as const,
      dataKey: 'saleProfit',
      label: 'Profit',
      color: '#f57c00',
      curve: 'natural' as const,
      showMark: true,
      yAxisId: 'leftAxis',
      valueFormatter: (v: number | null) => money(v),
    },
  ];

  return (
    <DynamicChart
      title="Purchase & Sale Trends"
      dataset={dataset}
      loading={loading}
      height={360}
      fill={fill}
      chartConfig={{
        lineSeries,
        barSeries: [],
        leftAxisLabel: 'Amount ($)',
        rightAxisLabel: '',
        // Profit can be negative (losses) — let the axis dip below 0.
        allowNegativeLeftAxis: true,
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
