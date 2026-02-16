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
      case "1h":
        fromDate.subtract(1, "hour");
        break;
      case "3h":
        fromDate.subtract(3, "hours");
        break;
      case "6h":
        fromDate.subtract(6, "hours");
        break;
      case "12h":
        fromDate.subtract(12, "hours");
        break;
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
      case "1h":
        fromDate.subtract(1, "hour");
        break;
      case "3h":
        fromDate.subtract(3, "hours");
        break;
      case "6h":
        fromDate.subtract(6, "hours");
        break;
      case "12h":
        fromDate.subtract(12, "hours");
        break;
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

// Hook for building primary market availability dataset - Capacity Chart
export const useAvailabilityCapacityChartData = (
  availabilityData: any,
  timeRange: string,
  interval: string
): ChartDataPoint[] => {
  return React.useMemo(() => {
    if (!availabilityData?.snapshots || availabilityData.snapshots.length === 0) {
      return [];
    }

    const snapshots = availabilityData.snapshots;

    // Calculate time range
    const now = moment.utc();
    const fromDate = now.clone();

    switch (timeRange) {
      case "1h":
        fromDate.subtract(1, "hour");
        break;
      case "3h":
        fromDate.subtract(3, "hours");
        break;
      case "6h":
        fromDate.subtract(6, "hours");
        break;
      case "12h":
        fromDate.subtract(12, "hours");
        break;
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

    // Calculate interval in milliseconds
    const intervalMs = interval.endsWith("d")
      ? parseInt(interval) * 24 * 60 * 60 * 1000
      : interval.endsWith("h")
      ? parseInt(interval) * 60 * 60 * 1000
      : parseInt(interval) * 60 * 1000;

    // Sort snapshots by timestamp
    const sortedSnapshots = [...snapshots].sort(
      (a, b) => moment.utc(a.timestamp).valueOf() - moment.utc(b.timestamp).valueOf()
    );

    // Find last snapshot before the time range
    let lastBefore = null;
    for (let i = sortedSnapshots.length - 1; i >= 0; i--) {
      const t = moment.utc(sortedSnapshots[i].timestamp).valueOf();
      if (t < rangeStart) {
        lastBefore = sortedSnapshots[i];
        break;
      }
    }

    // Group snapshots by time bucket
    const grouped: Record<number, any[]> = {};
    sortedSnapshots.forEach((snapshot: any) => {
      const time = moment.utc(snapshot.timestamp).valueOf();
      // Only include snapshots within the time range
      if (time >= rangeStart && time <= rangeEnd) {
        const bucket = Math.floor(time / intervalMs) * intervalMs;
        if (!grouped[bucket]) grouped[bucket] = [];
        grouped[bucket].push(snapshot);
      }
    });

    // Build result with aggregated data for each bucket
    const result: ChartDataPoint[] = [];
    const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
    const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

    // Initialize lastValue with lastBefore data or zeros
    let lastValue = lastBefore
      ? {
          totalCapacity: lastBefore.capacity?.total ?? 0,
          available: lastBefore.capacity?.available ?? 0,
          sold: (lastBefore.capacity?.total ?? 0) - (lastBefore.capacity?.available ?? 0),
          sellThroughRate: lastBefore.capacity?.total > 0 
            ? (((lastBefore.capacity?.total ?? 0) - (lastBefore.capacity?.available ?? 0)) / (lastBefore.capacity?.total ?? 0)) * 100 
            : 0,
        }
      : {
          totalCapacity: 0,
          available: 0,
          sold: 0,
          sellThroughRate: 0,
        };

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const bucketSnapshots = grouped[t] || [];

      if (bucketSnapshots.length === 0) {
        result.push({
          ...lastValue,
          time: formatDateTime(moment.utc(t).local()),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      } else {
        // Calculate averages for this bucket
        const totalCapacityAvg = bucketSnapshots.reduce((sum, s) => sum + s.capacity.total, 0) / bucketSnapshots.length;
        const availableAvg = bucketSnapshots.reduce((sum, s) => sum + s.capacity.available, 0) / bucketSnapshots.length;
        const soldAvg = totalCapacityAvg - availableAvg;
        const sellThroughRateAvg = totalCapacityAvg > 0 ? (soldAvg / totalCapacityAvg) * 100 : 0;

        lastValue = {
          totalCapacity: Math.round(totalCapacityAvg),
          available: Math.round(availableAvg),
          sold: Math.round(soldAvg),
          sellThroughRate: parseFloat(sellThroughRateAvg.toFixed(2)),
        };

        result.push({
          ...lastValue,
          time: formatDateTime(moment.utc(t).local()),
          bucketStartUTC: moment.utc(t).toISOString(),
        });
      }
    }

    return result;
  }, [availabilityData, timeRange, interval]);
};

// Hook for building primary market availability dataset - Section-wise Chart
export const useAvailabilitySectionChartData = (
  availabilityData: any,
  timeRange: string,
  interval: string
): ChartDataPoint[] => {
  return React.useMemo(() => {
    if (!availabilityData?.snapshots || availabilityData.snapshots.length === 0) {
      return [];
    }

    const snapshots = availabilityData.snapshots;

    // Calculate time range
    const now = moment.utc();
    const fromDate = now.clone();

    switch (timeRange) {
      case "1h":
        fromDate.subtract(1, "hour");
        break;
      case "3h":
        fromDate.subtract(3, "hours");
        break;
      case "6h":
        fromDate.subtract(6, "hours");
        break;
      case "12h":
        fromDate.subtract(12, "hours");
        break;
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

    // Calculate interval in milliseconds
    const intervalMs = interval.endsWith("d")
      ? parseInt(interval) * 24 * 60 * 60 * 1000
      : interval.endsWith("h")
      ? parseInt(interval) * 60 * 60 * 1000
      : parseInt(interval) * 60 * 1000;

    // Get all unique section names from all snapshots within time range
    const allSections = new Set<string>();
    const sectionTotals = new Map<string, number>();
    
    snapshots.forEach((snapshot: any) => {
      const time = moment.utc(snapshot.timestamp).valueOf();
      if (time >= rangeStart && time <= rangeEnd) {
        snapshot.summary?.sections?.forEach((section: any) => {
          if (section.available > 0) {
            allSections.add(section.name);
            const current = sectionTotals.get(section.name) || 0;
            sectionTotals.set(section.name, current + section.available);
          }
        });
      }
    });

    // Get top 10 sections by total availability across all snapshots
    const topSections = Array.from(sectionTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);

    // Sort snapshots by timestamp
    const sortedSnapshots = [...snapshots].sort(
      (a, b) => moment.utc(a.timestamp).valueOf() - moment.utc(b.timestamp).valueOf()
    );

    // Find last snapshot before the time range
    let lastBefore = null;
    for (let i = sortedSnapshots.length - 1; i >= 0; i--) {
      const t = moment.utc(sortedSnapshots[i].timestamp).valueOf();
      if (t < rangeStart) {
        lastBefore = sortedSnapshots[i];
        break;
      }
    }

    // Group snapshots by time bucket
    const grouped: Record<number, any[]> = {};
    sortedSnapshots.forEach((snapshot: any) => {
      const time = moment.utc(snapshot.timestamp).valueOf();
      if (time >= rangeStart && time <= rangeEnd) {
        const bucket = Math.floor(time / intervalMs) * intervalMs;
        if (!grouped[bucket]) grouped[bucket] = [];
        grouped[bucket].push(snapshot);
      }
    });

    // Build result with aggregated data for each bucket
    const result: ChartDataPoint[] = [];
    const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
    const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

    // Initialize lastValue with lastBefore data or zeros for each section
    let lastValue: ChartDataPoint = {
      time: "",
      bucketStartUTC: "",
    };
    
    topSections.forEach((sectionName) => {
      if (lastBefore) {
        const section = lastBefore.summary?.sections?.find(
          (s: any) => s.name === sectionName
        );
        lastValue[sectionName] = section?.available || 0;
      } else {
        lastValue[sectionName] = 0;
      }
    });

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const bucketSnapshots = grouped[t] || [];
      const dataPoint: ChartDataPoint = {
        time: formatDateTime(moment.utc(t).local()),
        bucketStartUTC: moment.utc(t).toISOString(),
      };

      if (bucketSnapshots.length > 0) {
        // Calculate average availability for each top section in this bucket
        topSections.forEach((sectionName) => {
          let totalAvailability = 0;
          let count = 0;
          
          bucketSnapshots.forEach((snapshot: any) => {
            const section = snapshot.summary?.sections?.find(
              (s: any) => s.name === sectionName
            );
            if (section) {
              totalAvailability += section.available;
              count++;
            }
          });
          
          const avgAvailability = count > 0 ? totalAvailability / count : 0;
          dataPoint[sectionName] = Math.round(avgAvailability);
          lastValue[sectionName] = Math.round(avgAvailability);
        });
      } else {
        // No data for this bucket, use last value for each section
        topSections.forEach((sectionName) => {
          dataPoint[sectionName] = lastValue[sectionName] || 0;
        });
      }

      result.push(dataPoint);
    }

    return result;
  }, [availabilityData, timeRange, interval]);
};

// Hook for building primary market availability dataset - Price Point Chart
export const useAvailabilityPriceChartData = (
  availabilityData: any,
  timeRange: string,
  interval: string
): ChartDataPoint[] => {
  return React.useMemo(() => {
    if (!availabilityData?.snapshots || availabilityData.snapshots.length === 0) {
      return [];
    }

    const snapshots = availabilityData.snapshots;

    // Calculate time range
    const now = moment.utc();
    const fromDate = now.clone();

    switch (timeRange) {
      case "1h":
        fromDate.subtract(1, "hour");
        break;
      case "3h":
        fromDate.subtract(3, "hours");
        break;
      case "6h":
        fromDate.subtract(6, "hours");
        break;
      case "12h":
        fromDate.subtract(12, "hours");
        break;
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

    // Calculate interval in milliseconds
    const intervalMs = interval.endsWith("d")
      ? parseInt(interval) * 24 * 60 * 60 * 1000
      : interval.endsWith("h")
      ? parseInt(interval) * 60 * 60 * 1000
      : parseInt(interval) * 60 * 1000;

    // Get all unique price points from all snapshots within time range
    const allPrices = new Set<number>();
    const priceTotals = new Map<number, number>();

    snapshots.forEach((snapshot: any) => {
      const time = moment.utc(snapshot.timestamp).valueOf();
      if (time >= rangeStart && time <= rangeEnd) {
        snapshot.summary?.pricePoints?.forEach((pp: any) => {
          if (pp.available > 0) {
            allPrices.add(pp.price);
            const current = priceTotals.get(pp.price) || 0;
            priceTotals.set(pp.price, current + pp.available);
          }
        });
      }
    });

    // Get top 10 price points by total availability across all snapshots
    const topPrices = Array.from(priceTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([price]) => price);

    // Sort snapshots by timestamp
    const sortedSnapshots = [...snapshots].sort(
      (a, b) => moment.utc(a.timestamp).valueOf() - moment.utc(b.timestamp).valueOf()
    );

    // Find last snapshot before the time range
    let lastBefore = null;
    for (let i = sortedSnapshots.length - 1; i >= 0; i--) {
      const t = moment.utc(sortedSnapshots[i].timestamp).valueOf();
      if (t < rangeStart) {
        lastBefore = sortedSnapshots[i];
        break;
      }
    }

    // Group snapshots by time bucket
    const grouped: Record<number, any[]> = {};
    sortedSnapshots.forEach((snapshot: any) => {
      const time = moment.utc(snapshot.timestamp).valueOf();
      if (time >= rangeStart && time <= rangeEnd) {
        const bucket = Math.floor(time / intervalMs) * intervalMs;
        if (!grouped[bucket]) grouped[bucket] = [];
        grouped[bucket].push(snapshot);
      }
    });

    // Build result with aggregated data for each bucket
    const result: ChartDataPoint[] = [];
    const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
    const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

    // Initialize lastValue with lastBefore data or zeros for each price point
    let lastValue: ChartDataPoint = {
      time: "",
      bucketStartUTC: "",
    };
    
    topPrices.forEach((price) => {
      const priceKey = `${price.toFixed(2)}`;
      if (lastBefore) {
        const pricePoint = lastBefore.summary?.pricePoints?.find(
          (pp: any) => pp.price === price
        );
        lastValue[priceKey] = pricePoint?.available || 0;
      } else {
        lastValue[priceKey] = 0;
      }
    });

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const bucketSnapshots = grouped[t] || [];
      const dataPoint: ChartDataPoint = {
        time: formatDateTime(moment.utc(t).local()),
        bucketStartUTC: moment.utc(t).toISOString(),
      };

      if (bucketSnapshots.length > 0) {
        // Calculate average availability for each top price point in this bucket
        topPrices.forEach((price) => {
          let totalAvailability = 0;
          let count = 0;

          bucketSnapshots.forEach((snapshot: any) => {
            const pricePoint = snapshot.summary?.pricePoints?.find(
              (pp: any) => pp.price === price
            );
            if (pricePoint) {
              totalAvailability += pricePoint.available;
              count++;
            }
          });

          const avgAvailability = count > 0 ? totalAvailability / count : 0;
          const priceKey = `${price.toFixed(2)}`;
          dataPoint[priceKey] = Math.round(avgAvailability);
          lastValue[priceKey] = Math.round(avgAvailability);
        });
      } else {
        // No data for this bucket, use last value for each price point
        topPrices.forEach((price) => {
          const priceKey = `${price.toFixed(2)}`;
          dataPoint[priceKey] = lastValue[priceKey] || 0;
        });
      }

      result.push(dataPoint);
    }

    return result;
  }, [availabilityData, timeRange, interval]);
};
