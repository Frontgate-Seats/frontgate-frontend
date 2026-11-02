/**
 * Dashboard API service
 *
 * All Supabase access for the dashboard feature lives here — the dashboard
 * components/pages go through the dashboard slice, never `supabaseClient`
 * directly. Mirrors the purchases.api.ts conventions (default-object export,
 * getErrorMessage on failure, fetchGridPage for paginated/sorted/filtered reads).
 */

import supabaseClient from "../clients/supabase.client";
import {
  fetchGridPage,
  applySingleFilter,
  type GridQuerySpec,
  type GridPageResult,
} from "../shared/utils/supabase.util";
import { getErrorMessage } from "../shared/utils/error.util";
import type { DataGridQueryOptions } from "../shared/types/mui.type";
import type { DateRange, Purchase, Sale } from "../types/dashboard.types";
import { startOfDayIso } from "../shared/utils/dateTime.util";

// ─── Shared types ───────────────────────────────────────────────────────────

export interface InventorySummary {
  totalInvested: number;
  activeInvested: number;
  /** Invested amount for AVAILABLE inventory with future events. */
  activeAvailableInvested: number;
  totalSold: number;
  activeSold: number;
  totalProfit: number;

  // Total status breakdown
  available: number;
  onHold: number;
  depleted: number;
  partialSold: number;
  unsold: number;

  // Active (future-event) status breakdown
  activeItems: number;
  activeAvailable: number;
  activeOnHold: number;
  activeDepleted: number;
  activePartialSold: number;
  activeUnsold: number;

  uniquePurchases: number;
}

export interface PurchasesSummary {
  totalQty: number;
  totalCost: number;
  totalSale: number;
  totalProfit: number;
}

export interface SalesSummary {
  totalQty: number;
  totalSale: number;
  totalProfit: number;
}

export interface CombinedChartBucket {
  time: string; // YYYY-MM-DD
  purchaseCount: number;
  purchaseAmount: number;
  saleCount: number;
  saleAmount: number;
  /** Profit from tickets sold that day (sold_inventory.profit by invoice_date). */
  saleProfit: number;
}

// ─── Column maps for the grid pipeline ──────────────────────────────────────

const PURCHASES_SPEC: GridQuerySpec = {
  fieldMap: {
    purchaseId: "purchase_id",
    orderId: "order_id",
    inventoryId: "inventory_id",
    eventId: "event_id",
    eventName: "event_name",
    venueName: "venue_name",
    eventDate: "event_local_date",
    createdAt: "created_at",
    section: "section",
    row: "row",
    quantity: "quantity",
    pricePerTicket: "price_per",
    totalCost: "total_amount",
    soldPrice: "sold_price",
    profit: "profit",
    status: "inventory_status",
    fulfillmentStatus: "fulfillment_status",
  },
  columnTypes: {
    quantity: "number",
    pricePerTicket: "number",
    totalCost: "number",
    soldPrice: "number",
    profit: "number",
    createdAt: "dateTime",
    eventDate: "dateTime",
  },
  defaultSort: { field: "createdAt", sort: "desc" },
};

const SALES_SPEC: GridQuerySpec = {
  fieldMap: {
    orderId: "order_id",
    inventoryId: "inventory_id",
    eventId: "event_id",
    eventName: "event_name",
    venueName: "venue_name",
    eventDate: "event_utc_date",
    invoiceDate: "invoice_date",
    saleDate: "created_at",
    section: "section",
    row: "row",
    quantitySold: "quantity_sold",
    totalSaleValue: "sale_total",
    profitLoss: "profit",
    fulfillmentStatus: "fulfillment_status",
  },
  columnTypes: {
    quantitySold: "number",
    totalSaleValue: "number",
    profitLoss: "number",
    invoiceDate: "dateTime",
    saleDate: "dateTime",
    eventDate: "dateTime",
  },
  defaultSort: { field: "saleDate", sort: "desc" },
};

const PURCHASES_SELECT =
  `id, created_at, order_id, purchase_id, inventory_id, event_id, event_name,
   venue_name, section, row, quantity, price_per, total_amount, profit,
   sold_price, event_local_date, inventory_status, fulfillment_status`;

const SALES_SELECT =
  `id, created_at, invoice_date, order_id, purchase_ids, inventory_id,
   event_id, event_name, venue_name, section, row,
   quantity_sold, sale_total, profit, event_utc_date, fulfillment_status`;

// ─── Row flatteners (DB row -> UI shape) ─────────────────────────────────────

const toPurchase = (r: any): Purchase => ({
  id: r.id,
  createdAt: r.created_at,
  orderId: r.order_id ?? null,
  purchaseId: r.purchase_id ?? null,
  inventoryId: r.inventory_id ?? null,
  eventId: r.event_id ?? null,
  eventName: r.event_name,
  venueName: r.venue_name,
  section: r.section,
  row: r.row,
  quantity: r.quantity,
  pricePerTicket: parseFloat(r.price_per),
  totalCost: parseFloat(r.total_amount),
  profit: parseFloat(r.profit) || 0,
  soldPrice: parseFloat(r.sold_price) || 0,
  eventDate: r.event_local_date,
  status: r.inventory_status,
  fulfillmentStatus: r.fulfillment_status ?? null,
});

const toSale = (r: any): Sale => ({
  id: r.id,
  invoiceDate: r.invoice_date,
  saleDate: r.created_at,
  orderId: r.order_id,
  purchaseIds: Array.isArray(r.purchase_ids) ? r.purchase_ids.map(String) : [],
  inventoryId: r.inventory_id ?? null,
  eventId: r.event_id ?? null,
  eventName: r.event_name,
  venueName: r.venue_name,
  section: r.section,
  row: r.row,
  quantitySold: r.quantity_sold,
  salePricePerTicket:
    r.quantity_sold > 0 ? parseFloat(r.sale_total) / r.quantity_sold : 0,
  totalSaleValue: parseFloat(r.sale_total),
  profitLoss: parseFloat(r.profit),
  eventDate: r.event_utc_date,
  fulfillmentStatus: r.fulfillment_status ?? null,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Merge the date-range filter (on `dateColumn`) into the grid filter options. */
const withDateRange = (
  options: DataGridQueryOptions,
  dateField: string,
  dateRange: DateRange,
): DataGridQueryOptions => ({
  ...options,
  filters: {
    ...options.filters,
    items: [
      ...(options.filters?.items ?? []),
      { field: dateField, operator: "onOrAfter", value: dateRange.startDate.toISOString() },
      { field: dateField, operator: "onOrBefore", value: dateRange.endDate.toISOString() },
    ],
  },
});

/** Build the shared date + user filter clause onto a raw query (for summaries). */
const applyDateFilter = (q: any, column: string, dateRange: DateRange) =>
  q
    .gte(column, dateRange.startDate.toISOString())
    .lte(column, dateRange.endDate.toISOString());

// ─── Inventory summary (cards) ───────────────────────────────────────────────

const getInventorySummary = async (): Promise<InventorySummary> => {
  const [summaryRes, availRes] = await Promise.all([
    supabaseClient.rpc("get_inventory_summary"),
    supabaseClient
      .from("inventory")
      .select("total_amount")
      .ilike("inventory_status", "available")
      .gte("event_utc_date", startOfDayIso()),
  ]);

  if (summaryRes.error) throw new Error(getErrorMessage(summaryRes.error));
  if (availRes.error) throw new Error(getErrorMessage(availRes.error));

  const d = (summaryRes.data ?? {}) as Record<string, unknown>;
  const num = (k: string) => Number(d[k] ?? 0);

  const activeAvailableInvested = (availRes.data ?? []).reduce(
    (s: number, r: any) => s + (parseFloat(r.total_amount) || 0),
    0,
  );

  return {
    totalInvested: num("totalInvested"),
    activeInvested: num("activeInvested"),
    activeAvailableInvested,
    totalSold: num("totalSold"),
    activeSold: num("activeSold"),
    totalProfit: num("totalProfit"),
    available: num("available"),
    onHold: num("onHold"),
    depleted: num("depleted"),
    partialSold: num("partialSold"),
    unsold: num("unsold"),
    activeItems: num("activeItems"),
    activeAvailable: num("activeAvailable"),
    activeOnHold: num("activeOnHold"),
    activeDepleted: num("activeDepleted"),
    activePartialSold: num("activePartialSold"),
    activeUnsold: num("activeUnsold"),
    uniquePurchases: num("uniquePurchases"),
  };
};

// ─── Purchases (inventory) page + summary ────────────────────────────────────

const fetchPurchases = async (
  dateRange: DateRange,
  options: DataGridQueryOptions,
): Promise<GridPageResult<Purchase>> => {
  const baseQuery = supabaseClient
    .from("inventory")
    .select(PURCHASES_SELECT, { count: "exact" });
  return fetchGridPage<any, Purchase>(
    baseQuery,
    withDateRange(options, "createdAt", dateRange),
    PURCHASES_SPEC,
    toPurchase,
  );
};

const fetchPurchasesSummary = async (
  dateRange: DateRange,
  options: DataGridQueryOptions,
): Promise<PurchasesSummary> => {
  // Sum across the whole filtered set (date range + user filters), not just one page.
  let q = applyDateFilter(
    supabaseClient.from("inventory").select("quantity, total_amount, sold_price, profit"),
    "created_at",
    dateRange,
  );
  // Reuse the grid filter translator by piping through fetchGridPage's filter
  // helper is overkill here; instead re-apply the user filters manually.
  q = applyGridFilterItems(q, options, PURCHASES_SPEC);

  const { data, error } = await q;
  if (error) throw new Error(getErrorMessage(error));

  const rows = (data ?? []) as any[];
  return {
    totalQty: rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
    totalCost: rows.reduce((s, r) => s + (parseFloat(r.total_amount) || 0), 0),
    totalSale: rows.reduce((s, r) => s + (parseFloat(r.sold_price) || 0), 0),
    totalProfit: rows.reduce((s, r) => s + (parseFloat(r.profit) || 0), 0),
  };
};

// ─── Sales (sold_inventory) page + summary ───────────────────────────────────

const fetchSales = async (
  dateRange: DateRange,
  options: DataGridQueryOptions,
): Promise<GridPageResult<Sale>> => {
  const baseQuery = supabaseClient
    .from("sold_inventory")
    .select(SALES_SELECT, { count: "exact" });
  return fetchGridPage<any, Sale>(
    baseQuery,
    withDateRange(options, "invoiceDate", dateRange),
    SALES_SPEC,
    toSale,
  );
};

const fetchSalesSummary = async (
  dateRange: DateRange,
  options: DataGridQueryOptions,
): Promise<SalesSummary> => {
  let q = applyDateFilter(
    supabaseClient.from("sold_inventory").select("quantity_sold, sale_total, profit"),
    "invoice_date",
    dateRange,
  );
  q = applyGridFilterItems(q, options, SALES_SPEC);

  const { data, error } = await q;
  if (error) throw new Error(getErrorMessage(error));

  const rows = (data ?? []) as any[];
  return {
    totalQty: rows.reduce((s, r) => s + (Number(r.quantity_sold) || 0), 0),
    totalSale: rows.reduce((s, r) => s + (parseFloat(r.sale_total) || 0), 0),
    totalProfit: rows.reduce((s, r) => s + (parseFloat(r.profit) || 0), 0),
  };
};

// ─── Combined chart ──────────────────────────────────────────────────────────

/** Local-time YYYY-MM-DD for a Date. */
const formatLocalDay = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Local-time YYYY-MM-DD for a timestamptz string, or null if unparsable. */
const toLocalDayKey = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : formatLocalDay(d);
};

const buildDateRange = (start: Date, end: Date): string[] => {
  const dates: string[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endD = new Date(end);
  endD.setHours(0, 0, 0, 0);
  while (cur <= endD) {
    dates.push(formatLocalDay(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

const aggregateDaily = async (
  table: string,
  dateCol: string,
  amountCol: string,
  dateRange: DateRange,
  profitCol?: string,
) => {
  const cols = [dateCol, amountCol, ...(profitCol ? [profitCol] : [])].join(", ");

  // Page through results: PostgREST caps each response (1000 rows by default),
  // and since rows are ordered oldest-first, a single request would silently
  // drop the most recent days on long ranges.
  const PAGE = 1000;
  const data: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabaseClient
      .from(table)
      .select(cols)
      .gte(dateCol, dateRange.startDate.toISOString())
      .lte(dateCol, dateRange.endDate.toISOString())
      .order(dateCol, { ascending: true })
      .order("id", { ascending: true }) // stable order across pages
      .range(from, from + PAGE - 1);
    if (error) throw new Error(getErrorMessage(error));
    data.push(...(page ?? []));
    if (!page || page.length < PAGE) break;
  }

  const agg = new Map<string, { count: number; amount: number; profit: number }>();
  ((data ?? []) as unknown[]).forEach((row) => {
    const r = row as Record<string, string>;
    // Bucket by the LOCAL calendar day, matching the local-midnight date
    // filter and buildDateRange's keys. Splitting the raw ISO string on "T"
    // would use the UTC day and shift late-evening rows into the next day.
    const key = toLocalDayKey(r[dateCol]);
    if (!key) return;
    const prev = agg.get(key) ?? { count: 0, amount: 0, profit: 0 };
    agg.set(key, {
      count: prev.count + 1,
      amount: prev.amount + (parseFloat(r[amountCol] ?? "0") || 0),
      profit: prev.profit + (profitCol ? parseFloat(r[profitCol] ?? "0") || 0 : 0),
    });
  });
  return agg;
};

const getCombinedChart = async (
  dateRange: DateRange,
): Promise<CombinedChartBucket[]> => {
  const [purchaseAgg, saleAgg] = await Promise.all([
    aggregateDaily("inventory", "created_at", "total_amount", dateRange),
    aggregateDaily("sold_inventory", "invoice_date", "sale_total", dateRange, "profit"),
  ]);

  return buildDateRange(dateRange.startDate, dateRange.endDate).map((day) => ({
    time: day,
    purchaseCount: purchaseAgg.get(day)?.count ?? 0,
    purchaseAmount: purchaseAgg.get(day)?.amount ?? 0,
    saleCount: saleAgg.get(day)?.count ?? 0,
    saleAmount: saleAgg.get(day)?.amount ?? 0,
    saleProfit: saleAgg.get(day)?.profit ?? 0,
  }));
};

// ─── Filter translation for the summary aggregates ───────────────────────────
// The summary queries can't go through fetchGridPage (no pagination/flatten),
// so we re-apply just the user filters using the same fieldMap + operators as
// the grid pipeline (via applySingleFilter from supabase.util).
function applyGridFilterItems(q: any, options: DataGridQueryOptions, spec: GridQuerySpec) {
  const items = options.filters?.items ?? [];
  return items.reduce((acc, item) => {
    const path = spec.fieldMap[item.field];
    if (!path || !item.operator) return acc;
    return applySingleFilter(acc, { ...item, field: path }, spec.columnTypes?.[item.field]);
  }, q);
}

const dashboardApi = {
  getInventorySummary,
  fetchPurchases,
  fetchPurchasesSummary,
  fetchSales,
  fetchSalesSummary,
  getCombinedChart,
};

export default dashboardApi;
