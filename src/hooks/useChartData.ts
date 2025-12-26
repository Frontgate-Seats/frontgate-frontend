import * as React from "react";
import moment from "moment";
import { formatDateTime } from "../shared/utils/dateTime.util";
import type { ChartDataPoint } from "../shared/types/components.types";

// Hook for building listings meta dataset
export const useListingsChartData = (
  listingsMeta: any[],
  timeRange: string,
  interval: string
): ChartDataPoint[] => {
  return React.useMemo(() => {
    if (!listingsMeta || listingsMeta.length === 0) return [];

    const now = moment.utc();
    const fromDate = now.clone();

    switch (timeRange) {
      case "1d":
        fromDate.subtract(1, "day");
        break;
      case "7d":
        fromDate.subtract(7, "days");
        break;
      case "30d":
        fromDate.subtract(30, "days");
        break;
      case "3m":
        fromDate.subtract(3, "months");
        break;
      case "6m":
        fromDate.subtract(6, "months");
        break;
      case "1y":
        fromDate.subtract(1, "year");
        break;
    }

    const rangeStart = fromDate.valueOf();
    const rangeEnd = now.valueOf();

    const intervalMs = interval.endsWith("d")
      ? parseInt(interval) * 24 * 60 * 60 * 1000
      : interval.endsWith("h")
      ? parseInt(interval) * 60 * 60 * 1000
      : parseInt(interval) * 60 * 1000;

    const sorted = [...listingsMeta].sort(
      (a, b) =>
        moment.utc(a.createdAt).valueOf() - moment.utc(b.createdAt).valueOf()
    );

    let lastBefore = null;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const t = moment.utc(sorted[i].createdAt).valueOf();
      if (t < rangeStart) {
        lastBefore = sorted[i];
        break;
      }
    }

    const rangeData = sorted.filter((item) => {
      const t = moment.utc(item.createdAt).valueOf();
      return t >= rangeStart && t <= rangeEnd;
    });

    const grouped: Record<number, any[]> = {};
    rangeData.forEach((item) => {
      const time = moment.utc(item.createdAt).valueOf();
      const bucket = Math.floor(time / intervalMs) * intervalMs;
      if (!grouped[bucket]) grouped[bucket] = [];
      grouped[bucket].push(item);
    });

    const result: ChartDataPoint[] = [];
    let lastValue = lastBefore
      ? {
          tickets: lastBefore.ticketCount ?? 0,
          priceMin: lastBefore.priceMin ?? 0,
          twoPlusPriceMin: lastBefore.twoPlusPriceMin ?? 0,
          getInPriceMin: lastBefore.getInPriceMin ?? 0,
        }
      : { tickets: 0, priceMin: 0, twoPlusPriceMin: 0, getInPriceMin: 0 };

    const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
    const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const arr = grouped[t] || [];

      if (arr.length === 0) {
        result.push({
          ...lastValue,
          time: formatDateTime(moment.utc(t).local()),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      } else {
        const avg = (f: string) =>
          arr.reduce((s, i) => s + (i[f] ?? 0), 0) / arr.length;

        lastValue = {
          tickets: Math.round(avg("ticketCount")),
          priceMin: +avg("priceMin").toFixed(2),
          twoPlusPriceMin: +avg("twoPlusPriceMin").toFixed(2),
          getInPriceMin: +avg("getInPriceMin").toFixed(2),
        };

        result.push({
          ...lastValue,
          time: formatDateTime(moment.utc(t).local()),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      }
    }

    return result;
  }, [listingsMeta, timeRange, interval]);
};

// Hook for building sales meta dataset
export const useSalesChartData = (
  salesMeta: any[],
  timeRange: string,
  interval: string
): ChartDataPoint[] => {
  return React.useMemo(() => {
    if (!salesMeta || salesMeta.length === 0) return [];

    const now = moment.utc();
    const fromDate = now.clone();

    switch (timeRange) {
      case "1d":
        fromDate.subtract(1, "day");
        break;
      case "7d":
        fromDate.subtract(7, "days");
        break;
      case "30d":
        fromDate.subtract(30, "days");
        break;
      case "3m":
        fromDate.subtract(3, "months");
        break;
      case "6m":
        fromDate.subtract(6, "months");
        break;
      case "1y":
        fromDate.subtract(1, "year");
        break;
    }

    const rangeStart = fromDate.valueOf();
    const rangeEnd = now.valueOf();

    const intervalMs = interval.endsWith("d")
      ? parseInt(interval) * 24 * 60 * 60 * 1000
      : interval.endsWith("h")
      ? parseInt(interval) * 60 * 60 * 1000
      : parseInt(interval) * 60 * 1000;

    const sorted = [...salesMeta].sort(
      (a, b) =>
        moment.utc(a.createdAt).valueOf() - moment.utc(b.createdAt).valueOf()
    );

    const rangeData = sorted.filter((item) => {
      const t = moment.utc(item.createdAt).valueOf();
      return t >= rangeStart && t <= rangeEnd;
    });

    const grouped: Record<number, any[]> = {};
    rangeData.forEach((item) => {
      const time = moment.utc(item.createdAt).valueOf();
      const bucket = Math.floor(time / intervalMs) * intervalMs;
      if (!grouped[bucket]) grouped[bucket] = [];
      grouped[bucket].push(item);
    });

    const result: ChartDataPoint[] = [];
    const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
    const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const arr = grouped[t] || [];

      if (arr.length === 0) {
        result.push({
          totalSales: 0,
          totalUnits: 0,
          totalSalesPrice: 0,
          minPrice: 0,
          maxPrice: 0,
          averagePrice: 0,
          medianPrice: 0,
          time: formatDateTime(moment.utc(t).local()),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      } else {
        const avg = (f: string) =>
          arr.reduce((s, i) => s + (i[f] ?? 0), 0) / arr.length;

        result.push({
          totalSales: Math.round(avg("totalSales")),
          totalUnits: Math.round(avg("totalUnits")),
          totalSalesPrice: +avg("totalSalesPrice").toFixed(2),
          minPrice: +avg("minPrice").toFixed(2),
          maxPrice: +avg("maxPrice").toFixed(2),
          averagePrice: +avg("averagePrice").toFixed(2),
          medianPrice: +avg("medianPrice").toFixed(2),
          time: formatDateTime(moment.utc(t).local()),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      }
    }

    return result;
  }, [salesMeta, timeRange, interval]);
};

// Hook for building charts page dataset (similar to listings but with different structure)
export const useChartsPageData = (
  listingsMeta: any[],
  timeRange: string,
  interval: string
): ChartDataPoint[] => {
  return React.useMemo(() => {
    if (!listingsMeta || listingsMeta.length === 0) return [];

    const now = moment.utc();
    const fromDate = now.clone();

    switch (timeRange) {
      case "1d":
        fromDate.subtract(1, "day");
        break;
      case "7d":
        fromDate.subtract(7, "days");
        break;
      case "30d":
        fromDate.subtract(30, "days");
        break;
      case "3m":
        fromDate.subtract(3, "months");
        break;
      case "6m":
        fromDate.subtract(6, "months");
        break;
      case "1y":
        fromDate.subtract(1, "year");
        break;
    }

    const rangeStart = fromDate.valueOf();
    const rangeEnd = now.valueOf();

    const intervalMs = interval.endsWith("d")
      ? parseInt(interval) * 24 * 60 * 60 * 1000
      : interval.endsWith("h")
      ? parseInt(interval) * 60 * 60 * 1000
      : parseInt(interval) * 60 * 1000;

    const sorted = [...listingsMeta].sort(
      (a, b) =>
        moment.utc(a.createdAt).valueOf() - moment.utc(b.createdAt).valueOf()
    );

    let lastBefore = null;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const t = moment.utc(sorted[i].createdAt).valueOf();
      if (t < rangeStart) {
        lastBefore = sorted[i];
        break;
      }
    }

    const rangeData = sorted.filter((item) => {
      const t = moment.utc(item.createdAt).valueOf();
      return t >= rangeStart && t <= rangeEnd;
    });

    const grouped: Record<number, any[]> = {};
    rangeData.forEach((item) => {
      const time = moment.utc(item.createdAt).valueOf();
      const bucket = Math.floor(time / intervalMs) * intervalMs;
      if (!grouped[bucket]) grouped[bucket] = [];
      grouped[bucket].push(item);
    });

    const result: ChartDataPoint[] = [];
    let lastValue = lastBefore
      ? {
          tickets: lastBefore.ticketCount ?? 0,
          priceMin: lastBefore.priceMin ?? 0,
          twoPlusPriceMin: lastBefore.twoPlusPriceMin ?? 0,
          getInPriceMin: lastBefore.getInPriceMin ?? 0,
        }
      : { tickets: 0, priceMin: 0, twoPlusPriceMin: 0, getInPriceMin: 0 };

    const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
    const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const arr = grouped[t] || [];

      if (arr.length === 0) {
        result.push({
          ...lastValue,
          time: formatDateTime(moment.utc(t).local()),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      } else {
        const avg = (f: string) =>
          arr.reduce((s, i) => s + (i[f] ?? 0), 0) / arr.length;

        lastValue = {
          tickets: Math.round(avg("ticketCount")),
          priceMin: +avg("priceMin").toFixed(2),
          twoPlusPriceMin: +avg("twoPlusPriceMin").toFixed(2),
          getInPriceMin: +avg("getInPriceMin").toFixed(2),
        };

        result.push({
          ...lastValue,
          time: formatDateTime(moment.utc(t).local()),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      }
    }

    return result;
  }, [listingsMeta, timeRange, interval]);
};