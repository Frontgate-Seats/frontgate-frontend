import type { DataGridQueryOptions } from "../shared/types/mui.type";
import type { LlmResultComment, Trade } from "../shared/types/trade.types";
import supabaseClient from "../clients/supabase.client";
import { getErrorMessage } from "../shared/utils/error.util";
import { fetchGridPage, type GridQuerySpec } from "../shared/utils/supabase.util";

export type { LlmResultComment as TradeComment };

/**
 * Event identity (name / venue / performer / date) lives on `events`.
 * It used to be denormalized onto `event_analysis_logs` too, but those copies
 * were dropped from the table — querying them is what produced
 * `42703 column event_analysis_logs_1.event_name does not exist`.
 * `event_analysis_logs` is now joined only for `llm_result`.
 */
const TRADES_SELECT = `
  id,
  event_analysis_log_id,
  event_id,
  listing_id,
  vs_section,
  row,
  quantity,
  max_buy_price,
  projected_sell_price,
  estimated_margin_percent,
  confidence_level,
  sell_source,
  buy_source,
  bad_rec,
  is_auto_trade,
  created_at,
  llm_result_comment,
  event_analysis_logs!inner (
    llm_result
  ),
  events!inner (
    name,
    venue_name,
    primary_performer_name,
    web_path,
    local_date
  )
`;

const TRADES_QUERY_SPEC: GridQuerySpec = {
  // Grid field -> column path. Fields not listed here are never sent to
  // Postgres, so a stale grid column can no longer trigger a 42703.
  fieldMap: {
    // event_buy_listings_logs (base table)
    id: "id",
    event_analysis_log_id: "event_analysis_log_id",
    event_id: "event_id",
    listing_id: "listing_id",
    vs_section: "vs_section",
    row: "row",
    quantity: "quantity",
    max_buy_price: "max_buy_price",
    projected_sell_price: "projected_sell_price",
    estimated_margin_percent: "estimated_margin_percent",
    confidence_level: "confidence_level",
    sell_source: "sell_source",
    buy_source: "buy_source",
    bad_rec: "bad_rec",
    is_auto_trade: "is_auto_trade",
    created_at: "created_at",
    // events (embedded)
    event_name: "events.name",
    venue_name: "events.venue_name",
    primary_performer_name: "events.primary_performer_name",
    local_date: "events.local_date",
  },
  columnTypes: {
    id: "number",
    event_analysis_log_id: "number",
    event_id: "number",
    listing_id: "string",
    vs_section: "string",
    row: "string",
    quantity: "number",
    max_buy_price: "number",
    projected_sell_price: "number",
    estimated_margin_percent: "number",
    confidence_level: "string",
    sell_source: "string",
    buy_source: "string",
    bad_rec: "boolean",
    is_auto_trade: "boolean",
    created_at: "dateTime",
    event_name: "string",
    venue_name: "string",
    primary_performer_name: "string",
    local_date: "dateTime",
  },
  defaultSort: { field: "created_at", sort: "desc" },
  foreignSortFetchLimit: 1000,
};

/** Lift the embedded `events` / `event_analysis_logs` rows onto the flat grid shape. */
const flattenTrade = (row: any): Trade => ({
  ...row,
  event_name: row.events?.name ?? "-",
  venue_name: row.events?.venue_name ?? "-",
  primary_performer_name: row.events?.primary_performer_name ?? "-",
  local_date: row.events?.local_date ?? null,
  vs_web_path: row.events?.web_path ?? null,
  llm_result: row.event_analysis_logs?.llm_result ?? null,
  llm_result_comment: row.llm_result_comment ?? null,
  sell_source: row.sell_source ?? null,
  buy_source: row.buy_source ?? null,
  // Not columns on event_buy_listings_logs — kept so the grid shape stays stable.
  llm_matched_section: null,
  is_auto_trade: row.is_auto_trade ?? false,
});

const tradesApi = {
  updateTradeComment: async (tradeId: number | string, comment: LlmResultComment) => {
    // When the user sets feedback to "bad", flip bad_rec = true so the pipeline
    // excludes this listing from future buy prompts. Clear it for any other state.
    const isBadFeedback = comment.human_comment?.feedback === "bad";

    const { data, error } = await supabaseClient
      .from("event_buy_listings_logs")
      .update({ llm_result_comment: comment, bad_rec: isBadFeedback })
      .eq("id", tradeId)
      .select("id, llm_result_comment, bad_rec")
      .single();

    if (error) {
      throw new Error(getErrorMessage(error));
    }
    return data;
  },

  fetchTrades: async (options: DataGridQueryOptions = {}) => {
    const baseQuery = supabaseClient
      .from("event_buy_listings_logs")
      .select(TRADES_SELECT, { count: "exact" });

    return fetchGridPage<any, Trade>(
      baseQuery,
      options,
      TRADES_QUERY_SPEC,
      flattenTrade,
    );
  },
};

export default tradesApi;
