import moment from "moment";

// Date format constants
const DATE_FORMAT = "M/D/YY";
const TIME_FORMAT = "h:mm A";
const FALLBACK_VALUE = "-";

export const formatDateTime = (
  date: string | Date | moment.Moment | null | undefined,
  includeTime = true,
  includeDate = true
): string => {
  if (!date) return FALLBACK_VALUE;

  try {
    const momentDate = moment.isMoment(date) ? date : moment(date);

    if (!momentDate.isValid()) {
      return FALLBACK_VALUE;
    }

    if (includeDate && includeTime) {
      return `${momentDate.format(DATE_FORMAT)} ${momentDate.format(
        TIME_FORMAT
      )}`;
    }
    if (includeDate) {
      return momentDate.format(DATE_FORMAT);
    }
    if (includeTime) {
      return momentDate.format(TIME_FORMAT);
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

    return timeRange === "1d" ? date.format("h:mm A") : date.format("M/D");
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
