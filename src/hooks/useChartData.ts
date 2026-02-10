import * as React from "react";
import moment from "moment";
import { formatDateTime } from "../shared/utils/dateTime.util";
import type { ChartDataPoint } from "../shared/types/components.types";

// Hook for building sales meta dataset
export const useSalesChartData = (
  sales: any[],
  timeRange: string,
  interval: string
): ChartDataPoint[] => {

  return React.useMemo(() => {
    if (!sales || sales.length === 0) return [];

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

    const sorted = [...sales].sort(
      (a, b) =>
        moment.utc(a.purchased_at).valueOf() - moment.utc(b.purchased_at).valueOf()
    );

    const rangeData = sorted.filter((item) => {
      const t = moment.utc(item.purchased_at).valueOf();
      return t >= rangeStart && t <= rangeEnd;
    });

    const grouped: Record<number, any[]> = {};
    rangeData.forEach((item) => {
      const time = moment.utc(item.purchased_at).valueOf();
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
        const prices = arr.map(item => item.base_price);
        const quantities = arr.map(item => item.quantity);
        const totalRevenue = arr.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);
        const totalQuantity = quantities.reduce((sum, qty) => sum + qty, 0);
        const sortedPrices = [...prices].sort((a, b) => a - b);
        
        const medianPrice = sortedPrices.length % 2 === 0
          ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
          : sortedPrices[Math.floor(sortedPrices.length / 2)];

        result.push({
          totalSales: arr.length,
          totalUnits: totalQuantity,
          totalSalesPrice: +totalRevenue.toFixed(2),
          minPrice: +Math.min(...prices).toFixed(2),
          maxPrice: +Math.max(...prices).toFixed(2),
          averagePrice: +(prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2),
          medianPrice: +medianPrice.toFixed(2),
          time: formatDateTime(moment.utc(t).local()),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      }
    }

    return result;
  }, [sales, timeRange, interval]);
};

// Hook for building charts page dataset
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

// Hook for building listing trends dataset
export const useListingTrendsChartData = (
  listingTrends: any[],
  timeRange: string,
  interval: string
): ChartDataPoint[] => {
  return React.useMemo(() => {
    if (!listingTrends || listingTrends.length === 0) return [];

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

    const sorted = [...listingTrends].sort(
      (a, b) =>
        moment.utc(a.created_at).valueOf() - moment.utc(b.created_at).valueOf()
    );

    let lastBefore = null;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const t = moment.utc(sorted[i].created_at).valueOf();
      if (t < rangeStart) {
        lastBefore = sorted[i];
        break;
      }
    }

    const rangeData = sorted.filter((item) => {
      const t = moment.utc(item.created_at).valueOf();
      return t >= rangeStart && t <= rangeEnd;
    });

    const grouped: Record<number, any[]> = {};
    rangeData.forEach((item) => {
      const time = moment.utc(item.created_at).valueOf();
      const bucket = Math.floor(time / intervalMs) * intervalMs;
      if (!grouped[bucket]) grouped[bucket] = [];
      grouped[bucket].push(item);
    });

    const result: ChartDataPoint[] = [];
    let lastValue = lastBefore
      ? {
          minPriceAll: lastBefore.min_price_all ?? 0,
          minPricePair: lastBefore.min_price_pair ?? 0,
          secMinPricePair: lastBefore.sec_min_price_pair ?? 0,
          medianPricePair: lastBefore.median_price_pair ?? 0,
          ticketCount: lastBefore.sec_ticket_count ?? 0,
          listingCount: lastBefore.sec_listing_count ?? 0,
        }
      : {
          minPriceAll: 0,
          minPricePair: 0,
          secMinPricePair: 0,
          medianPricePair: 0,
          ticketCount: 0,
          listingCount: 0,
        };

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
          minPriceAll: +avg("min_price_all").toFixed(2),
          minPricePair: +avg("min_price_pair").toFixed(2),
          secMinPricePair: +avg("sec_min_price_pair").toFixed(2),
          medianPricePair: +avg("median_price_pair").toFixed(2),
          ticketCount: Math.round(avg("sec_ticket_count")),
          listingCount: Math.round(avg("sec_listing_count")),
        };

        result.push({
          ...lastValue,
          time: formatDateTime(moment.utc(t).local()),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      }
    }

    return result;
  }, [listingTrends, timeRange, interval]);
};
