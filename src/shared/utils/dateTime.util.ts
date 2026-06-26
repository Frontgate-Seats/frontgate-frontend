import moment from "moment";

// Fallback value for invalid/missing dates
const FALLBACK_VALUE = "-";

// Intl formatters (reused for performance)
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "numeric",
  day: "numeric",
  year: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateOnlyFormatter = new Intl.DateTimeFormat(undefined, {
  month: "numeric",
  day: "numeric",
  year: "2-digit",
});

const timeOnlyFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

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
      return dateTimeFormatter.format(d);
    }
    if (includeDate) {
      return dateOnlyFormatter.format(d);
    }
    if (includeTime) {
      return timeOnlyFormatter.format(d);
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

export const formatChartAxis = (
  date: moment.Moment,
  timeRange: string
): string => {
  try {
    if (!date.isValid()) {
      return FALLBACK_VALUE;
    }

    if (timeRange?.endsWith("h")) {
      return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date.toDate());
    }

    return new Intl.DateTimeFormat(undefined, {
      month: "numeric",
      day: "numeric",
    }).format(date.toDate());
  } catch {
    return FALLBACK_VALUE;
  }
};

export const parseChartTime = (value: string, timeRange: string): string => {
  try {
    const parsed = moment(value, "MM/DD/YYYY hh:mm A");

    if (!parsed.isValid()) {
      return value;
    }

    return formatChartAxis(parsed, timeRange);
  } catch {
    return value;
  }
};
