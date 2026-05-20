import type { DataGridQueryOptions } from "../shared/types/mui.type";
import supabaseClient from "../clients/supabase.client";
import { getErrorMessage } from "../shared/utils/error.util";
import { applyFilters, applySorting, applyPagination } from "../shared/utils/supabase.util";

const tradesApi = {
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
          event_analysis_logs (
            event_name,
            utc_date,
            venue_name,
            primary_performer_name
          ),
          events (
            web_path
          )
        `,
          { count: "exact" },
        );

      query = applyFilters(query as any, filters) as typeof query;
      query = applySorting(query as any, sortFields) as typeof query;
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
        vs_web_path: row.events?.web_path ?? null,
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
