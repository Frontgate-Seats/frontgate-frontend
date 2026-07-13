import * as React from "react";
import moment from "moment";
import { formatDateTime } from "../shared/utils/dateTime.util";
import type { ChartDataPoint } from "../shared/types/components.types";

/**
 * Returns the range-start timestamp (ms) for a given timeRange string.
 * "all" → -1 (sentinel: use earliest data point instead of epoch).
 * Any unrecognised value also falls back to -1.
 */
function getRangeStart(timeRange: string): number {
  if (timeRange === "all") return -1; // sentinel — caller must use earliest data ts
  const now = moment.utc();
  switch (timeRange) {
    case "1h":  return now.subtract(1, "hour").valueOf();
    case "3h":  return now.subtract(3, "hours").valueOf();
    case "6h":  return now.subtract(6, "hours").valueOf();
    case "12h": return now.subtract(12, "hours").valueOf();
    case "1d":  return now.subtract(1, "day").valueOf();
    case "7d":  return now.subtract(7, "days").valueOf();
    case "30d": return now.subtract(30, "days").valueOf();
    case "3m":  return now.subtract(3, "months").valueOf();
    case "6m":  return now.subtract(6, "months").valueOf();
    case "1y":  return now.subtract(1, "year").valueOf();
    default:    return -1;
  }
}

/** Max chart points we'll ever render — keeps the chart snappy. */
const MAX_CHART_POINTS = 500;

/**
 * Given a desired intervalMs and a time span, returns an intervalMs that
 * produces at most MAX_CHART_POINTS buckets.
 */
function clampIntervalMs(intervalMs: number, spanMs: number): number {
  const minInterval = Math.ceil(spanMs / MAX_CHART_POINTS);
  return Math.max(intervalMs, minInterval);
}

/** Parse an interval string like "1d", "6h", "30m" → milliseconds. */
function parseIntervalMs(interval: string): number {
  if (interval.endsWith("d")) return parseInt(interval) * 24 * 60 * 60 * 1000;
  if (interval.endsWith("h")) return parseInt(interval) * 60 * 60 * 1000;
  return parseInt(interval) * 60 * 1000;
}

// Hook for building sales meta dataset
export const useSalesChartData = (
  sales: any[],
  timeRange: string,
  interval: string
): ChartDataPoint[] => {

  return React.useMemo(() => {
    if (!sales || sales.length === 0) return [];

    const rangeEnd = moment.utc().valueOf();
    const rawRangeStart = getRangeStart(timeRange);

    const sorted = [...sales].sort(
      (a, b) =>
        moment.utc(a.purchased_at).valueOf() - moment.utc(b.purchased_at).valueOf()
    );

    // For "all", anchor to the earliest actual data point
    const rangeStart = rawRangeStart === -1
      ? (sorted.length > 0 ? moment.utc(sorted[0].purchased_at).valueOf() : rangeEnd)
      : rawRangeStart;

    const spanMs = rangeEnd - rangeStart;
    const intervalMs = clampIntervalMs(parseIntervalMs(interval), spanMs);

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

    // First, group by created_at and calculate aggregates for each timestamp
    const groupedByTimestamp: Record<string, any> = {};
    
    listingTrends.forEach((item) => {
      const timestamp = item.created_at;
      if (!groupedByTimestamp[timestamp]) {
        groupedByTimestamp[timestamp] = {
          created_at: timestamp,
          items: [],
        };
      }
      groupedByTimestamp[timestamp].items.push(item);
    });

    // Calculate aggregates for each timestamp
    const aggregatedData = Object.values(groupedByTimestamp).map((group: any) => {
      const items = group.items;
      
      // Find overall minimum prices across all sections
      const minPriceAll = Math.min(...items.map((i: any) => i.min_price_all ?? Infinity));
      const minPricePair = Math.min(...items.map((i: any) => i.min_price_pair ?? Infinity));
      
      // Calculate totals for ticket and listing counts
      const totalTicketCount = items.reduce((sum: number, i: any) => sum + (i.sec_ticket_count ?? 0), 0);
      const totalListingCount = items.reduce((sum: number, i: any) => sum + (i.sec_listing_count ?? 0), 0);
      
      // Calculate weighted median price (using ticket counts as weights)
      const validPairs = items.filter((i: any) => i.median_price_pair != null && i.sec_ticket_count > 0);
      let medianPricePair = 0;
      if (validPairs.length > 0) {
        const totalWeight = validPairs.reduce((sum: number, i: any) => sum + i.sec_ticket_count, 0);
        medianPricePair = validPairs.reduce((sum: number, i: any) => 
          sum + (i.median_price_pair * i.sec_ticket_count), 0) / totalWeight;
      }
      
      // Calculate weighted sec_min_price_pair
      const validSecMin = items.filter((i: any) => i.sec_min_price_pair != null && i.sec_ticket_count > 0);
      let secMinPricePair = 0;
      if (validSecMin.length > 0) {
        const totalWeight = validSecMin.reduce((sum: number, i: any) => sum + i.sec_ticket_count, 0);
        secMinPricePair = validSecMin.reduce((sum: number, i: any) => 
          sum + (i.sec_min_price_pair * i.sec_ticket_count), 0) / totalWeight;
      }

      return {
        created_at: group.created_at,
        min_price_all: minPriceAll === Infinity ? 0 : minPriceAll,
        min_price_pair: minPricePair === Infinity ? 0 : minPricePair,
        sec_min_price_pair: secMinPricePair,
        median_price_pair: medianPricePair,
        sec_ticket_count: totalTicketCount,
        sec_listing_count: totalListingCount,
      };
    });

    // Now apply time range filtering and bucketing
    const rangeEnd = moment.utc().valueOf();
    const rawRangeStart = getRangeStart(timeRange);

    const sorted = [...aggregatedData].sort(
      (a, b) =>
        moment.utc(a.created_at).valueOf() - moment.utc(b.created_at).valueOf()
    );

    // For "all", anchor to the earliest actual data point
    const rangeStart = rawRangeStart === -1
      ? (sorted.length > 0 ? moment.utc(sorted[0].created_at).valueOf() : rangeEnd)
      : rawRangeStart;

    const spanMs = rangeEnd - rangeStart;
    const intervalMs = clampIntervalMs(parseIntervalMs(interval), spanMs);

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
    
    // Find first data point in the range to use as "next data" when needed
    let firstDataInRange = null;
    if (rangeData.length > 0) {
      firstDataInRange = rangeData[0];
    }
    
    // Initialize lastValue with lastBefore data if available, otherwise null
    let lastValue = lastBefore
      ? {
          minPriceAll: lastBefore.min_price_all ?? 0,
          minPricePair: lastBefore.min_price_pair ?? 0,
          secMinPricePair: lastBefore.sec_min_price_pair ?? 0,
          medianPricePair: lastBefore.median_price_pair ?? 0,
          ticketCount: lastBefore.sec_ticket_count ?? 0,
          listingCount: lastBefore.sec_listing_count ?? 0,
        }
      : null;

    const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
    const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const arr = grouped[t] || [];

      if (arr.length === 0) {
        // If no data in this bucket
        let values;
        if (lastValue) {
          // Use lastValue if available (from historical data or previous bucket)
          values = lastValue;
        } else if (firstDataInRange) {
          // No lastValue, but we have first data in range - use it as "next data"
          values = {
            minPriceAll: firstDataInRange.min_price_all ?? 0,
            minPricePair: firstDataInRange.min_price_pair ?? 0,
            secMinPricePair: firstDataInRange.sec_min_price_pair ?? 0,
            medianPricePair: firstDataInRange.median_price_pair ?? 0,
            ticketCount: firstDataInRange.sec_ticket_count ?? 0,
            listingCount: firstDataInRange.sec_listing_count ?? 0,
          };
        } else {
          // No data at all
          values = {
            minPriceAll: 0,
            minPricePair: 0,
            secMinPricePair: 0,
            medianPricePair: 0,
            ticketCount: 0,
            listingCount: 0,
          };
        }
        
        result.push({
          ...values,
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

    const rangeEnd = moment.utc().valueOf();
    const rawRangeStart = getRangeStart(timeRange);

    // Sort snapshots by timestamp
    const sortedSnapshots = [...snapshots].sort(
      (a, b) => moment.utc(a.timestamp).valueOf() - moment.utc(b.timestamp).valueOf()
    );

    // For "all", anchor to the earliest actual snapshot
    const rangeStart = rawRangeStart === -1
      ? (sortedSnapshots.length > 0 ? moment.utc(sortedSnapshots[0].timestamp).valueOf() : rangeEnd)
      : rawRangeStart;

    const spanMs = rangeEnd - rangeStart;
    const intervalMs = clampIntervalMs(parseIntervalMs(interval), spanMs);

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

    // Find first snapshot in the range to use as "next data" when needed
    let firstSnapshotInRange = null;
    const snapshotsInRange = sortedSnapshots.filter(s => {
      const t = moment.utc(s.timestamp).valueOf();
      return t >= rangeStart && t <= rangeEnd;
    });
    if (snapshotsInRange.length > 0) {
      firstSnapshotInRange = snapshotsInRange[0];
    }
    
    // Initialize lastValue with lastBefore data if available, otherwise null
    let lastValue = lastBefore
      ? {
          totalCapacity: lastBefore.capacity?.total ?? 0,
          available: lastBefore.capacity?.available ?? 0,
          sold: (lastBefore.capacity?.total ?? 0) - (lastBefore.capacity?.available ?? 0),
          sellThroughRate: lastBefore.capacity?.total > 0 
            ? (((lastBefore.capacity?.total ?? 0) - (lastBefore.capacity?.available ?? 0)) / (lastBefore.capacity?.total ?? 0)) * 100 
            : 0,
        }
      : null;

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const bucketSnapshots = grouped[t] || [];

      if (bucketSnapshots.length === 0) {
        // If no data in this bucket
        let values;
        if (lastValue) {
          // Use lastValue if available (from historical data or previous bucket)
          values = lastValue;
        } else if (firstSnapshotInRange) {
          // No lastValue, but we have first snapshot in range - use it as "next data"
          values = {
            totalCapacity: firstSnapshotInRange.capacity?.total ?? 0,
            available: firstSnapshotInRange.capacity?.available ?? 0,
            sold: (firstSnapshotInRange.capacity?.total ?? 0) - (firstSnapshotInRange.capacity?.available ?? 0),
            sellThroughRate: firstSnapshotInRange.capacity?.total > 0 
              ? (((firstSnapshotInRange.capacity?.total ?? 0) - (firstSnapshotInRange.capacity?.available ?? 0)) / (firstSnapshotInRange.capacity?.total ?? 0)) * 100 
              : 0,
          };
        } else {
          // No data at all
          values = {
            totalCapacity: 0,
            available: 0,
            sold: 0,
            sellThroughRate: 0,
          };
        }
        
        result.push({
          ...values,
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

// Combined hook for all availability data (capacity table, sections, price points)
export const useAvailabilityData = (
  availabilityData: any,
  timeRange: string,
  interval: string
) => {
  return React.useMemo(() => {
    if (!availabilityData?.snapshots || availabilityData.snapshots.length === 0) {
      return {
        capacityTable: [],
        sectionChart: [],
        priceChart: [],
      };
    }

    const snapshots = availabilityData.snapshots;

    const rangeEnd = moment.utc().valueOf();
    const rawRangeStart = getRangeStart(timeRange);

    // Sort snapshots by timestamp
    const sortedSnapshots = [...snapshots].sort(
      (a, b) => moment.utc(a.timestamp).valueOf() - moment.utc(b.timestamp).valueOf()
    );

    // For "all", anchor to the earliest actual snapshot
    const rangeStart = rawRangeStart === -1
      ? (sortedSnapshots.length > 0 ? moment.utc(sortedSnapshots[0].timestamp).valueOf() : rangeEnd)
      : rawRangeStart;

    const spanMs = rangeEnd - rangeStart;
    const intervalMs = clampIntervalMs(parseIntervalMs(interval), spanMs);

    // Find last snapshot before the time range
    let lastBefore = null;
    for (let i = sortedSnapshots.length - 1; i >= 0; i--) {
      const t = moment.utc(sortedSnapshots[i].timestamp).valueOf();
      if (t < rangeStart) {
        lastBefore = sortedSnapshots[i];
        break;
      }
    }

    // Get snapshots in range
    const snapshotsInRange = sortedSnapshots.filter(s => {
      const t = moment.utc(s.timestamp).valueOf();
      return t >= rangeStart && t <= rangeEnd;
    });
    const firstSnapshotInRange = snapshotsInRange.length > 0 ? snapshotsInRange[0] : null;

    // Get all unique sections and price points from snapshots in range
    const allSections = new Set<string>();
    const allPrices = new Set<number>();
    
    snapshotsInRange.forEach((snapshot: any) => {
      const sections = snapshot.summary?.greenSeats?.sections || snapshot.summary?.sections || [];
      sections.forEach((section: any) => {
        if (section.available > 0) {
          allSections.add(section.name);
        }
      });
      const pps = snapshot.summary?.greenSeats?.pricePoints || snapshot.summary?.pricePoints || [];
      pps.forEach((pp: any) => {
        if (pp.available > 0) {
          allPrices.add(pp.price);
        }
      });
    });

    const sectionNames = Array.from(allSections);
    const pricePoints = Array.from(allPrices).sort((a, b) => a - b);

    // Group snapshots by time bucket
    const grouped: Record<number, any[]> = {};
    snapshotsInRange.forEach((snapshot: any) => {
      const time = moment.utc(snapshot.timestamp).valueOf();
      const bucket = Math.floor(time / intervalMs) * intervalMs;
      if (!grouped[bucket]) grouped[bucket] = [];
      grouped[bucket].push(snapshot);
    });

    // Build results
    const capacityTable: ChartDataPoint[] = [];
    const sectionChart: ChartDataPoint[] = [];
    const priceChart: ChartDataPoint[] = [];
    
    const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
    const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

    // Initialize last values
    let lastCapacity = lastBefore ? {
      totalCapacity: lastBefore.capacity?.total ?? 0,
      available: lastBefore.capacity?.available ?? 0,
    } : null;

    let lastSections: Record<string, number> = {};
    if (lastBefore) {
      const lastBeforeSections = lastBefore.summary?.greenSeats?.sections || lastBefore.summary?.sections || [];
      sectionNames.forEach((sectionName) => {
        const section = lastBeforeSections.find((s: any) => s.name === sectionName);
        lastSections[sectionName] = section?.available || 0;
      });
    }

    let lastPrices: Record<string, number> = {};
    if (lastBefore) {
      const lastBeforePPs = lastBefore.summary?.greenSeats?.pricePoints || lastBefore.summary?.pricePoints || [];
      pricePoints.forEach((price) => {
        const priceKey = `${price.toFixed(2)}`;
        const pricePoint = lastBeforePPs.find((pp: any) => pp.price === price);
        lastPrices[priceKey] = pricePoint?.available || 0;
      });
    }

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const bucketSnapshots = grouped[t] || [];
      const timeStr = formatDateTime(moment.utc(t).local());
      const bucketStartUTC = moment.utc(t).toISOString();

      // Capacity Table Data
      if (bucketSnapshots.length > 0) {
        const totalCapacityAvg = bucketSnapshots.reduce((sum, s) => sum + (s.capacity?.total ?? 0), 0) / bucketSnapshots.length;
        const availableAvg = bucketSnapshots.reduce((sum, s) => sum + (s.capacity?.available ?? 0), 0) / bucketSnapshots.length;

        lastCapacity = {
          totalCapacity: Math.round(totalCapacityAvg),
          available: Math.round(availableAvg),
        };

        capacityTable.push({
          id: bucketStartUTC,
          time: timeStr,
          bucketStartUTC,
          totalCapacity: lastCapacity.totalCapacity,
          available: lastCapacity.available,
        });
      } else {
        const values = lastCapacity || (firstSnapshotInRange ? {
          totalCapacity: firstSnapshotInRange.capacity?.total ?? 0,
          available: firstSnapshotInRange.capacity?.available ?? 0,
        } : { totalCapacity: 0, available: 0 });

        capacityTable.push({
          id: bucketStartUTC,
          time: timeStr,
          bucketStartUTC,
          totalCapacity: values.totalCapacity,
          available: values.available,
        });
      }

      // Section Chart Data
      const sectionDataPoint: ChartDataPoint = {
        time: timeStr,
        bucketStartUTC,
      };

      if (bucketSnapshots.length > 0) {
        sectionNames.forEach((sectionName) => {
          let totalAvailability = 0;
          let count = 0;
          
          bucketSnapshots.forEach((snapshot: any) => {
            const sections = snapshot.summary?.greenSeats?.sections || snapshot.summary?.sections || [];
            const section = sections.find((s: any) => s.name === sectionName);
            if (section) {
              totalAvailability += section.available;
              count++;
            }
          });
          
          const avgAvailability = count > 0 ? totalAvailability / count : 0;
          sectionDataPoint[sectionName] = Math.round(avgAvailability);
          lastSections[sectionName] = Math.round(avgAvailability);
        });
      } else {
        sectionNames.forEach((sectionName) => {
          if (lastSections[sectionName] !== undefined) {
            sectionDataPoint[sectionName] = lastSections[sectionName];
          } else if (firstSnapshotInRange) {
            const sections = firstSnapshotInRange.summary?.greenSeats?.sections || firstSnapshotInRange.summary?.sections || [];
            const section = sections.find((s: any) => s.name === sectionName);
            sectionDataPoint[sectionName] = section?.available || 0;
          } else {
            sectionDataPoint[sectionName] = 0;
          }
        });
      }

      sectionChart.push(sectionDataPoint);

      // Price Chart Data
      const priceDataPoint: ChartDataPoint = {
        time: timeStr,
        bucketStartUTC,
      };

      if (bucketSnapshots.length > 0) {
        pricePoints.forEach((price) => {
          let totalAvailability = 0;
          let count = 0;

          bucketSnapshots.forEach((snapshot: any) => {
            const pps = snapshot.summary?.greenSeats?.pricePoints || snapshot.summary?.pricePoints || [];
            const pricePoint = pps.find((pp: any) => pp.price === price);
            if (pricePoint) {
              totalAvailability += pricePoint.available;
              count++;
            }
          });

          const avgAvailability = count > 0 ? totalAvailability / count : 0;
          const priceKey = `${price.toFixed(2)}`;
          priceDataPoint[priceKey] = Math.round(avgAvailability);
          lastPrices[priceKey] = Math.round(avgAvailability);
        });
      } else {
        pricePoints.forEach((price) => {
          const priceKey = `${price.toFixed(2)}`;
          if (lastPrices[priceKey] !== undefined) {
            priceDataPoint[priceKey] = lastPrices[priceKey];
          } else if (firstSnapshotInRange) {
            const pps = firstSnapshotInRange.summary?.greenSeats?.pricePoints || firstSnapshotInRange.summary?.pricePoints || [];
            const pricePoint = pps.find((pp: any) => pp.price === price);
            priceDataPoint[priceKey] = pricePoint?.available || 0;
          } else {
            priceDataPoint[priceKey] = 0;
          }
        });
      }

      priceChart.push(priceDataPoint);
    }

    return {
      capacityTable,
      sectionChart,
      priceChart,
    };
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

    const rangeEnd = moment.utc().valueOf();
    const rawRangeStart = getRangeStart(timeRange);

    // Sort snapshots first so we can anchor "all" to earliest
    const sortedForAnchor = [...snapshots].sort(
      (a, b) => moment.utc(a.timestamp).valueOf() - moment.utc(b.timestamp).valueOf()
    );
    const rangeStart = rawRangeStart === -1
      ? (sortedForAnchor.length > 0 ? moment.utc(sortedForAnchor[0].timestamp).valueOf() : rangeEnd)
      : rawRangeStart;

    const spanMs = rangeEnd - rangeStart;
    const intervalMs = clampIntervalMs(parseIntervalMs(interval), spanMs);

    // Get all unique section names from all snapshots within time range
    const allSections = new Set<string>();
    const sectionTotals = new Map<string, number>();
    
    snapshots.forEach((snapshot: any) => {
      const time = moment.utc(snapshot.timestamp).valueOf();
      if (time >= rangeStart && time <= rangeEnd) {
        const sections = snapshot.summary?.greenSeats?.sections || snapshot.summary?.sections || [];
        sections.forEach((section: any) => {
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

    // Find first snapshot in the range to use as "next data" when needed
    let firstSnapshotInRange = null;
    const snapshotsInRange = sortedSnapshots.filter(s => {
      const t = moment.utc(s.timestamp).valueOf();
      return t >= rangeStart && t <= rangeEnd;
    });
    if (snapshotsInRange.length > 0) {
      firstSnapshotInRange = snapshotsInRange[0];
    }
    
    // Initialize lastValue with lastBefore data if available, otherwise create empty object
    let lastValue: ChartDataPoint = {
      time: "",
      bucketStartUTC: "",
    };
    
    // If we have lastBefore data, populate lastValue with it
    if (lastBefore) {
      topSections.forEach((sectionName) => {
        const sections = lastBefore.summary?.greenSeats?.sections || lastBefore.summary?.sections || [];
        const section = sections.find(
          (s: any) => s.name === sectionName
        );
        lastValue[sectionName] = section?.available || 0;
      });
    }

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
            const sections = snapshot.summary?.greenSeats?.sections || snapshot.summary?.sections || [];
            const section = sections.find(
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
        // No data for this bucket
        topSections.forEach((sectionName) => {
          if (lastValue[sectionName] !== undefined) {
            // Use lastValue if available
            dataPoint[sectionName] = lastValue[sectionName];
          } else if (firstSnapshotInRange) {
            // No lastValue, but we have first snapshot in range - use it as "next data"
            const sections = firstSnapshotInRange.summary?.greenSeats?.sections || firstSnapshotInRange.summary?.sections || [];
            const section = sections.find(
              (s: any) => s.name === sectionName
            );
            dataPoint[sectionName] = section?.available || 0;
          } else {
            // No data at all
            dataPoint[sectionName] = 0;
          }
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

    const rangeEnd = moment.utc().valueOf();
    const rawRangeStart = getRangeStart(timeRange);

    const sortedForAnchor = [...snapshots].sort(
      (a, b) => moment.utc(a.timestamp).valueOf() - moment.utc(b.timestamp).valueOf()
    );
    const rangeStart = rawRangeStart === -1
      ? (sortedForAnchor.length > 0 ? moment.utc(sortedForAnchor[0].timestamp).valueOf() : rangeEnd)
      : rawRangeStart;

    const spanMs = rangeEnd - rangeStart;
    const intervalMs = clampIntervalMs(parseIntervalMs(interval), spanMs);

    // Get all unique price points from all snapshots within time range
    const allPrices = new Set<number>();
    const priceTotals = new Map<number, number>();

    snapshots.forEach((snapshot: any) => {
      const time = moment.utc(snapshot.timestamp).valueOf();
      if (time >= rangeStart && time <= rangeEnd) {
        const pps = snapshot.summary?.greenSeats?.pricePoints || snapshot.summary?.pricePoints || [];
        pps.forEach((pp: any) => {
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

    // Find first snapshot in the range to use as "next data" when needed
    let firstSnapshotInRange = null;
    const snapshotsInRange = sortedSnapshots.filter(s => {
      const t = moment.utc(s.timestamp).valueOf();
      return t >= rangeStart && t <= rangeEnd;
    });
    if (snapshotsInRange.length > 0) {
      firstSnapshotInRange = snapshotsInRange[0];
    }
    
    // Initialize lastValue with lastBefore data if available, otherwise create empty object
    let lastValue: ChartDataPoint = {
      time: "",
      bucketStartUTC: "",
    };
    
    // If we have lastBefore data, populate lastValue with it
    if (lastBefore) {
      topPrices.forEach((price) => {
        const priceKey = `${price.toFixed(2)}`;
        const pps = lastBefore.summary?.greenSeats?.pricePoints || lastBefore.summary?.pricePoints || [];
        const pricePoint = pps.find(
          (pp: any) => pp.price === price
        );
        lastValue[priceKey] = pricePoint?.available || 0;
      });
    }

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
            const pps = snapshot.summary?.greenSeats?.pricePoints || snapshot.summary?.pricePoints || [];
            const pricePoint = pps.find(
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
        // No data for this bucket
        topPrices.forEach((price) => {
          const priceKey = `${price.toFixed(2)}`;
          if (lastValue[priceKey] !== undefined) {
            // Use lastValue if available
            dataPoint[priceKey] = lastValue[priceKey];
          } else if (firstSnapshotInRange) {
            // No lastValue, but we have first snapshot in range - use it as "next data"
            const pps = firstSnapshotInRange.summary?.greenSeats?.pricePoints || firstSnapshotInRange.summary?.pricePoints || [];
            const pricePoint = pps.find(
              (pp: any) => pp.price === price
            );
            dataPoint[priceKey] = pricePoint?.available || 0;
          } else {
            // No data at all
            dataPoint[priceKey] = 0;
          }
        });
      }

      result.push(dataPoint);
    }

    return result;
  }, [availabilityData, timeRange, interval]);
};

// Hook for building combined sales dataset (SeatGeek + Vivid)
export const useCombinedSalesChartData = (
  seatgeekSales: any[],
  vividSales: any[],
  timeRange: string,
  interval: string
) => {
  return React.useMemo(() => {
    const rangeEnd = moment.utc().valueOf();
    const rawRangeStart = getRangeStart(timeRange);

    // For "all", anchor to the earliest sale across both sources
    let rangeStart = rawRangeStart;
    if (rawRangeStart === -1) {
      const allTs = [
        ...(seatgeekSales || []).map(i => moment.utc(i.purchased_at).valueOf()),
        ...(vividSales || []).map(i => moment.utc(i.saleDate).valueOf()),
      ].filter(t => !isNaN(t));
      rangeStart = allTs.length > 0 ? Math.min(...allTs) : rangeEnd;
    }

    const spanMs = rangeEnd - rangeStart;
    const intervalMs = clampIntervalMs(parseIntervalMs(interval), spanMs);

    // Process SeatGeek sales
    const seatgeekGrouped: Record<number, any[]> = {};
    if (seatgeekSales && seatgeekSales.length > 0) {
      seatgeekSales.forEach((item) => {
        const time = moment.utc(item.purchased_at).valueOf();
        if (time >= rangeStart && time <= rangeEnd) {
          const bucket = Math.floor(time / intervalMs) * intervalMs;
          if (!seatgeekGrouped[bucket]) seatgeekGrouped[bucket] = [];
          seatgeekGrouped[bucket].push(item);
        }
      });
    }

    // Process Vivid sales
    const vividGrouped: Record<number, any[]> = {};
    if (vividSales && vividSales.length > 0) {
      vividSales.forEach((item) => {
        const time = moment.utc(item.saleDate).valueOf();
        if (time >= rangeStart && time <= rangeEnd) {
          const bucket = Math.floor(time / intervalMs) * intervalMs;
          if (!vividGrouped[bucket]) vividGrouped[bucket] = [];
          vividGrouped[bucket].push(item);
        }
      });
    }

    const seatgeekData: ChartDataPoint[] = [];
    const vividData: ChartDataPoint[] = [];

    const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
    const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const timeStr = formatDateTime(moment.utc(t).local());
      const bucketStartUTC = moment.utc(t).toISOString();

      // SeatGeek data point
      const sgArr = seatgeekGrouped[t] || [];
      if (sgArr.length === 0) {
        seatgeekData.push({
          time: timeStr,
          bucketStartUTC,
          avgSalePrice: 0,
          totalListings: 0,
          totalTickets: 0,
        });
      } else {
        const prices = sgArr.map(item => item.base_price);
        const quantities = sgArr.map(item => item.quantity);
        const totalQuantity = quantities.reduce((sum, qty) => sum + qty, 0);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

        seatgeekData.push({
          time: timeStr,
          bucketStartUTC,
          avgSalePrice: +avgPrice.toFixed(2),
          totalListings: sgArr.length,
          totalTickets: totalQuantity,
        });
      }

      // Vivid data point
      const vividArr = vividGrouped[t] || [];
      if (vividArr.length === 0) {
        vividData.push({
          time: timeStr,
          bucketStartUTC,
          avgSalePrice: 0,
          totalListings: 0,
          totalTickets: 0,
        });
      } else {
        const totalListings = vividArr.reduce((sum, item) => sum + (item.totalListings || 0), 0);
        const totalTickets = vividArr.reduce((sum, item) => sum + (item.totalTickets || 0), 0);
        const avgPrice = vividArr.reduce((sum, item) => sum + (item.avgSalePrice || 0), 0) / vividArr.length;

        vividData.push({
          time: timeStr,
          bucketStartUTC,
          avgSalePrice: +avgPrice.toFixed(2),
          totalListings,
          totalTickets,
        });
      }
    }

    return {
      seatgeek: seatgeekData,
      vivid: vividData,
    };
  }, [seatgeekSales, vividSales, timeRange, interval]);
};

/**
 * Builds the combined sales chart dataset from already-normalized combined rows
 * (shape: { source: "SeatGeek"|"Vivid", purchased_at, base_price, quantity }).
 * This is the preferred hook when the rows have already been filtered/merged by
 * useClientFilters, so the chart always reflects the same data as the table.
 */
export const useCombinedSalesChartDataFromRows = (
  combinedRows: any[],
  timeRange: string,
  interval: string
) => {
  return React.useMemo(() => {
    const rangeEnd = moment.utc().valueOf();
    const rawRangeStart = getRangeStart(timeRange);

    // For "all", anchor to the earliest row
    let rangeStart = rawRangeStart;
    if (rawRangeStart === -1) {
      const allTs = (combinedRows || [])
        .map(r => moment.utc(r.purchased_at).valueOf())
        .filter(t => !isNaN(t));
      rangeStart = allTs.length > 0 ? Math.min(...allTs) : rangeEnd;
    }

    const spanMs = rangeEnd - rangeStart;
    const intervalMs = clampIntervalMs(parseIntervalMs(interval), spanMs);

    const sgGrouped: Record<number, any[]> = {};
    const vividGrouped: Record<number, any[]> = {};
    const stubhubGrouped: Record<number, any[]> = {};

    (combinedRows || []).forEach((row) => {
      const time = moment.utc(row.purchased_at).valueOf();
      if (time < rangeStart || time > rangeEnd) return;
      const bucket = Math.floor(time / intervalMs) * intervalMs;
      if (row.source === "SeatGeek") {
        if (!sgGrouped[bucket]) sgGrouped[bucket] = [];
        sgGrouped[bucket].push(row);
      } else if (row.source === "Vivid") {
        if (!vividGrouped[bucket]) vividGrouped[bucket] = [];
        vividGrouped[bucket].push(row);
      } else if (row.source === "StubHub") {
        if (!stubhubGrouped[bucket]) stubhubGrouped[bucket] = [];
        stubhubGrouped[bucket].push(row);
      }
    });

    const startBucket = Math.floor(rangeStart / intervalMs) * intervalMs;
    const endBucket = Math.ceil(rangeEnd / intervalMs) * intervalMs;

    const result: ChartDataPoint[] = [];

    for (let t = startBucket; t <= endBucket; t += intervalMs) {
      const timeStr = formatDateTime(moment.utc(t).local());
      const bucketStartUTC = moment.utc(t).toISOString();

      const sgArr = sgGrouped[t] || [];
      const vividArr = vividGrouped[t] || [];
      const stubhubArr = stubhubGrouped[t] || [];

      const sgAvgPrice = sgArr.length
        ? sgArr.reduce((s, r) => s + r.base_price, 0) / sgArr.length
        : 0;
      const sgTickets = sgArr.reduce((s, r) => s + (r.quantity || 0), 0);
      const sgTotalPrice = sgArr.reduce((s, r) => s + (r.total_price || r.base_price * (r.quantity || 1)), 0);

      const vividAvgPrice = vividArr.length
        ? vividArr.reduce((s, r) => s + r.base_price, 0) / vividArr.length
        : 0;
      const vividTickets = vividArr.reduce((s, r) => s + (r.quantity || 0), 0);
      const vividTotalPrice = vividArr.reduce((s, r) => s + (r.total_price || r.base_price * (r.quantity || 1)), 0);

      const stubhubAvgPrice = stubhubArr.length
        ? stubhubArr.reduce((s, r) => s + r.base_price, 0) / stubhubArr.length
        : 0;
      const stubhubTickets = stubhubArr.reduce((s, r) => s + (r.quantity || 0), 0);
      const stubhubTotalPrice = stubhubArr.reduce((s, r) => s + (r.total_price || r.base_price * (r.quantity || 1)), 0);

      result.push({
        time: timeStr,
        bucketStartUTC,
        seatgeekAvgPrice: +sgAvgPrice.toFixed(2),
        seatgeekListings: sgArr.length,
        seatgeekTickets: sgTickets,
        seatgeekTotalPrice: +sgTotalPrice.toFixed(2),
        vividAvgPrice: +vividAvgPrice.toFixed(2),
        vividListings: vividArr.length,
        vividTickets: vividTickets,
        vividTotalPrice: +vividTotalPrice.toFixed(2),
        stubhubAvgPrice: +stubhubAvgPrice.toFixed(2),
        stubhubListings: stubhubArr.length,
        stubhubTickets: stubhubTickets,
        stubhubTotalPrice: +stubhubTotalPrice.toFixed(2),
      });
    }

    return result;
  }, [combinedRows, timeRange, interval]);
};
