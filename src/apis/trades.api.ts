import type { DataGridQueryOptions } from "../shared/types/mui.type";
import type { LlmResultComment } from "../shared/types/trade.types";
import supabaseClient from "../clients/supabase.client";
import { getErrorMessage } from "../shared/utils/error.util";
import {
  applyFilters,
  applyPagination,
  remapFilters,
} from "../shared/utils/supabase.util";

export type { LlmResultComment as TradeComment };

// Map frontend field names to Supabase column paths for joined tables
const TRADES_FIELD_MAPPING: Record<string, string> = {
  // Fields from event_analysis_logs (joined table)
  event_name: "event_analysis_logs.event_name",
  utc_date: "event_analysis_logs.utc_date",
  venue_name: "event_analysis_logs.venue_name",
  primary_performer_name: "event_analysis_logs.primary_performer_name",
  // Fields from event_buy_listings_logs (main table) - no mapping needed
  // but explicitly listed for clarity
  id: "id",
  event_id: "event_id",
  listing_id: "listing_id",
  vs_section: "vs_section",
  row: "row",
  quantity: "quantity",
  max_buy_price: "max_buy_price",
  projected_sell_price: "projected_sell_price",
  estimated_margin_percent: "estimated_margin_percent",
  confidence_level: "confidence_level",
  created_at: "created_at",
};

// Map field names to their column types for proper filtering
const TRADES_COLUMN_TYPES: Record<string, string> = {
  id: "number",
  event_id: "number",
  listing_id: "number",
  event_analysis_log_id: "number",
  quantity: "number",
  max_buy_price: "number",
  projected_sell_price: "number",
  estimated_margin_percent: "number",
  created_at: "dateTime",
  utc_date: "dateTime",
  event_name: "string",
  venue_name: "string",
  primary_performer_name: "string",
  vs_section: "string",
  row: "string",
  confidence_level: "string",
};

const tradesApi = {
  updateTradeComment: async (tradeId: number | string, comment: LlmResultComment) => {
    const { data, error } = await supabaseClient
      .from("event_buy_listings_logs")
      .update({ llm_result_comment: comment })
      .eq("id", tradeId)
      .select("id, llm_result_comment")
      .single();

    if (error) {
      throw new Error(getErrorMessage(error));
    }
    return data;
  },

  fetchTrades: async (options: DataGridQueryOptions = {}) => {
    const { page = 0, pageSize = 25, sortFields, filters } = options;

    try {
      let query = supabaseClient
        .from("event_buy_listings_logs")
        .select(
          `
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
          created_at,
          llm_result_comment,
          event_analysis_logs!inner (
            event_name,
            utc_date,
            venue_name,
            primary_performer_name,
            llm_result
          ),
          events (
            web_path
          )
        `,
          { count: "exact" },
        );

      // Remap filter fields to include joined table paths
      const remappedFilters = remapFilters(filters, TRADES_FIELD_MAPPING);
      query = applyFilters(query as any, remappedFilters, TRADES_COLUMN_TYPES) as typeof query;

      // Handle sorting - separate local and joined table fields
      if (sortFields?.length) {
        for (const sort of sortFields) {
          const mappedField = TRADES_FIELD_MAPPING[sort.field] || sort.field;
          
          if (mappedField.includes('.')) {
            // For joined table columns, use the special syntax
            const [relation, column] = mappedField.split('.');
            query = query.order(column, {
              ascending: sort.sort === "asc",
              foreignTable: relation,
            }) as typeof query;
          } else {
            // For main table columns, use normal ordering
            query = query.order(mappedField, {
              ascending: sort.sort === "asc",
            }) as typeof query;
          }
        }
      }

      query = applyPagination(query as any, page, pageSize) as typeof query;

      const { data, error, count } = await query;

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      // Flatten event_analysis_logs fields to top level for DataGrid
      const flattenedData = (data || []).map((row: any) => ({
        ...row,
        event_name: row.event_analysis_logs?.event_name ?? "-",
        utc_date: row.event_analysis_logs?.utc_date ?? null,
        venue_name: row.event_analysis_logs?.venue_name ?? "-",
        primary_performer_name: row.event_analysis_logs?.primary_performer_name ?? "-",
        llm_result: row.event_analysis_logs?.llm_result ?? null,
        vs_web_path: row.events?.web_path ?? null,
        llm_result_comment: row.llm_result_comment ?? null,
      }));

      return {
        data: flattenedData,
        total: count || 0,
      };
    } catch (error) {
      console.error("Failed to fetch trades:", error);
      throw error;
    }
  },
};

export default tradesApi;
