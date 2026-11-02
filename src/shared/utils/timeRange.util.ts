/**
 * timeRange.util.ts
 *
 * Single source of truth for resolving time-range tokens ("7d", "30d",
 * "today", "1h", etc.) into concrete date boundaries.
 *
 * Two output formats are provided:
 *  - Millisecond timestamps (UTC) for chart aggregation hooks (useChartData).
 *  - DateRange objects (local time) for dashboard tables and filters.
 *
 * Both share the SAME token-to-calendar-logic mapping so there is no drift
 * between what "Last 7 Days" means on a chart vs. on a table.
 */

import moment from "moment";
import { startOfDay, endOfDay } from "./dateTime.util";
import type { DateRange, TimeRangeFilter } from "../../types/dashboard.types";

// "All Time" lower bound — early enough to predate any inventory.
export const ALL_TIME_START = new Date("2000-01-01T00:00:00Z");

// Sentinel returned by getRangeStartMs when the caller should use the
// earliest available data point as the start boundary.
export const RANGE_START_SENTINEL = -1;

// ─── UTC millisecond timestamps (for chart hooks) ─────────────────────────────

/**
 * Returns the range-start timestamp (ms, UTC) for a given timeRange string.
 * "all" → RANGE_START_SENTINEL (-1): caller must use the earliest data point.
 * "custom" → also -1: custom ranges are applied via the DateRange prop.
 *
 * Calendar-based ranges (today, yesterday, 7d, 30d, lastMonth, thisYear) snap
 * to midnight (start of day) to match SkyBox behavior.
 */
export function getRangeStartMs(timeRange: string): number {
  if (timeRange === "all" || timeRange === "custom") return RANGE_START_SENTINEL;
  const now = moment.utc();

  switch (timeRange) {
    // Intraday ranges stay rolling (no midnight snapping).
    case "1h":  return now.subtract(1, "hour").valueOf();
    case "3h":  return now.subtract(3, "hours").valueOf();
    case "6h":  return now.subtract(6, "hours").valueOf();
    case "12h": return now.subtract(12, "hours").valueOf();
    // Calendar-day ranges snap to midnight (start of day).
    case "today":      return now.clone().startOf("day").valueOf();
    case "yesterday":  return now.clone().subtract(1, "day").startOf("day").valueOf();
    case "7d":         return now.clone().subtract(7, "days").startOf("day").valueOf();
    case "30d":        return now.clone().subtract(30, "days").startOf("day").valueOf();
    case "lastMonth":  return now.clone().subtract(1, "month").startOf("month").valueOf();
    case "thisYear":   return now.clone().startOf("year").valueOf();
    default:           return RANGE_START_SENTINEL;
  }
}

/**
 * Returns the range-end timestamp (ms, UTC) for a given timeRange string.
 * Calendar-based ranges use end-of-day (23:59:59.999); rolling ranges use now.
 */
export function getRangeEndMs(timeRange: string): number {
  const now = moment.utc();

  switch (timeRange) {
    case "today":      return now.clone().endOf("day").valueOf();
    case "yesterday":  return now.clone().subtract(1, "day").endOf("day").valueOf();
    case "7d":
    case "30d":
    case "thisYear":   return now.clone().endOf("day").valueOf();
    case "lastMonth":  return now.clone().subtract(1, "month").endOf("month").valueOf();
    default:           return now.valueOf(); // Rolling ranges (1h, 3h, …) and "all"
  }
}

/**
 * Convenience: get both start and end boundaries as ms timestamps in one call.
 */
export function getRangeBoundaryMs(timeRange: string): { start: number; end: number } {
  return { start: getRangeStartMs(timeRange), end: getRangeEndMs(timeRange) };
}

// ─── DateRange objects (for dashboard tables & filters) ───────────────────────

/**
 * Resolve a TimeRangeFilter token into a concrete {startDate, endDate} using
 * local-time Date objects with midnight boundaries.
 *
 * - Intraday ranges (1h, 3h, 6h, 12h): rolling, no midnight snapping.
 * - Calendar ranges (today, yesterday, 7d, 30d, lastMonth, thisYear): start
 *   snaps to 00:00:00.000, end snaps to 23:59:59.999.
 * - "all": startDate = ALL_TIME_START, endDate = end of today.
 * - "custom": returns a default range; the actual custom dates are applied
 *   separately via the date pickers in DashboardFilter.
 */
export function resolveDateRange(value: TimeRangeFilter): DateRange {
  const now = new Date();

  switch (value) {
    case 'all':
      return { startDate: ALL_TIME_START, endDate: endOfDay(new Date()) };

    // Intraday ranges stay rolling (no midnight snapping).
    case '1h': {
      const start = new Date();
      start.setHours(start.getHours() - 1);
      return { startDate: start, endDate: new Date() };
    }
    case '3h': {
      const start = new Date();
      start.setHours(start.getHours() - 3);
      return { startDate: start, endDate: new Date() };
    }
    case '6h': {
      const start = new Date();
      start.setHours(start.getHours() - 6);
      return { startDate: start, endDate: new Date() };
    }
    case '12h': {
      const start = new Date();
      start.setHours(start.getHours() - 12);
      return { startDate: start, endDate: new Date() };
    }

    // Calendar-day ranges snap to midnight boundaries.
    case 'today':
      return { startDate: startOfDay(new Date()), endDate: endOfDay(new Date()) };

    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
    }

    case '7d': {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { startDate: startOfDay(start), endDate: endOfDay(new Date()) };
    }

    case '30d': {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { startDate: startOfDay(start), endDate: endOfDay(new Date()) };
    }

    case 'lastMonth': {
      // Full previous month: 1st of last month → last day of last month.
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const prevMonthStart = new Date(prevYear, prevMonth, 1);
      const prevMonthEnd = new Date(prevYear, prevMonth + 1, 0);
      return { startDate: startOfDay(prevMonthStart), endDate: endOfDay(prevMonthEnd) };
    }

    case 'thisYear':
      return { startDate: new Date(now.getFullYear(), 0, 1), endDate: endOfDay(new Date()) };

    case 'custom':
    default:
      return { startDate: ALL_TIME_START, endDate: endOfDay(new Date()) };
  }
}
