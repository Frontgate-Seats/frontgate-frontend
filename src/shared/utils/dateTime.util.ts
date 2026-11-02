import moment from "moment";

// Fallback value for invalid/missing dates
const FALLBACK_VALUE = "-";

// Unified display formats used across the whole app:
//   date  -> DD/MM/YY       (e.g. 07/11/26)
//   time  -> hh:mm A        (e.g. 05:45 PM)
export const DATE_FORMAT = "DD/MM/YY";
export const TIME_FORMAT = "hh:mm A";
export const DATE_TIME_FORMAT = "DD/MM/YY hh:mm A";

/**
 * Convert input to a native Date object.
 * Accepts string, Date, or moment instance.
 */
function toDate(date: string | Date | moment.Moment): Date | null {
  if (moment.isMoment(date)) {
    return date.toDate();
  }
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export const formatDateTime = (
  date: string | Date | moment.Moment | null | undefined,
  includeTime = true,
  includeDate = true
): string => {
  if (!date) return FALLBACK_VALUE;

  try {
    const d = toDate(date);
    if (!d) return FALLBACK_VALUE;

    if (includeDate && includeTime) {
      return moment(d).format(DATE_TIME_FORMAT);
    }
    if (includeDate) {
      return moment(d).format(DATE_FORMAT);
    }
    if (includeTime) {
      return moment(d).format(TIME_FORMAT);
    }

    return FALLBACK_VALUE;
  } catch {
    return FALLBACK_VALUE;
  }
};

export const formatDate = (
  date: string | Date | moment.Moment | null | undefined
): string => {
  return formatDateTime(date, false, true);
};

export const formatTime = (
  date: string | Date | moment.Moment | null | undefined
): string => {
  return formatDateTime(date, true, false);
};

// ─── Midnight-snap helpers ────────────────────────────────────────────────────
// SkyBox (and our filters) treat day-level dates as starting from midnight.
// These helpers ensure every date-only filter across the app snaps to 00:00:00.

/**
 * Snap a Date to midnight (start of the local day).
 * Returns a **new** Date — the input is not mutated.
 */
export const startOfDay = (d: Date): Date => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/**
 * Snap a Date to end of the local day (23:59:59.999).
 * Returns a **new** Date — the input is not mutated.
 */
export const endOfDay = (d: Date): Date => {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

/**
 * Return today's midnight as an ISO string — convenience wrapper used by
 * default date filters (inventory, events, etc.) that need a stable "today
 * at 00:00" value.
 */
export const startOfDayIso = (d: Date = new Date()): string =>
  startOfDay(d).toISOString();

/**
 * Snap an ISO date-string to midnight if it only represents a day
 * (i.e. comes from a DatePicker, not a DateTimePicker).
 * If the string already has a non-midnight time component, it is returned
 * unchanged so hour-level filters (1h, 3h, …) are not affected.
 */
export const snapDateOnlyToMidnight = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  // DatePicker values from MUI always land on 00:00 local, but let's be safe.
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

/**
 * Snap a date-only ISO string (YYYY-MM-DD) to end of day (23:59:59.999) in the
 * local timezone. Used for date-range "To" filters where we want to include
 * the entire selected day.
 */
export const snapDateOnlyToEndOfDay = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

export const formatChartAxis = (
  date: moment.Moment,
  timeRange: string
): string => {
  try {
    if (!date.isValid()) {
      return FALLBACK_VALUE;
    }

    if (timeRange?.endsWith("h")) {
      return date.format(TIME_FORMAT);
    }

    return date.format("DD/MM");
  } catch {
    return FALLBACK_VALUE;
  }
};

export const parseChartTime = (value: string, timeRange: string): string => {
  try {
    // Accept several incoming shapes: ISO (YYYY-MM-DD / full ISO) and the
    // legacy "MM/DD/YYYY hh:mm A" bucket label.
    let parsed = moment(value, moment.ISO_8601, true);
    if (!parsed.isValid()) {
      parsed = moment(value, "MM/DD/YYYY hh:mm A");
    }
    if (!parsed.isValid()) {
      parsed = moment(value);
    }

    if (!parsed.isValid()) {
      return value;
    }

    return formatChartAxis(parsed, timeRange);
  } catch {
    return value;
  }
};
