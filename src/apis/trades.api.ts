import type { DataGridQueryOptions } from "../shared/types/mui.type";
import type { LlmResultComment } from "../shared/types/trade.types";
import supabaseClient from "../clients/supabase.client";
import { getErrorMessage } from "../shared/utils/error.util";
import { applyPagination } from "../shared/utils/supabase.util";

export type { LlmResultComment as TradeComment };

// Map frontend field names to Supabase column paths for joined tables
const TRADES_FIELD_MAPPING: Record<string, string> = {
  // Fields from event_analysis_logs (joined table)
  event_name: "event_analysis_logs.event_name",
  venue_name: "event_analysis_logs.venue_name",
  primary_performer_name: "event_analysis_logs.primary_performer_name",
  // Fields from events (joined table)
  local_date: "events.local_date",
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
  local_date: "dateTime",
  event_name: "string",
  venue_name: "string",
  primary_performer_name: "string",
  vs_section: "string",
  row: "string",
  confidence_level: "string",
};

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
    const { page = 0, pageSize = 25, sortFields, filters } = options;

    // Separate joined table sorts from main table sorts
    const mainTableSorts: Array<{ field: string; sort: 'asc' | 'desc' }> = [];
    const joinedTableSorts: Array<{ field: string; sort: 'asc' | 'desc' }> = [];
    
    sortFields?.forEach(sortItem => {
      // Skip items where sort direction is null or undefined
      if (!sortItem.sort) return;
      
      const mappedField = TRADES_FIELD_MAPPING[sortItem.field] || sortItem.field;
      const sort = { field: sortItem.field, sort: sortItem.sort };
      
      if (mappedField.includes('.')) {
        joinedTableSorts.push(sort);
      } else {
        mainTableSorts.push(sort);
      }
    });

    const hasJoinedTableSort = joinedTableSorts.length > 0;
    
    // If sorting by joined table fields, we need to fetch more data and sort client-side
    // WARNING: This fetches up to 1000 rows. If your table exceeds this, consider:
    // 1. Increasing the limit
    // 2. Denormalizing joined fields into the main table
    // 3. Creating a database view with the joined fields
    const fetchPageSize = hasJoinedTableSort ? 1000 : pageSize;
    const fetchPage = hasJoinedTableSort ? 0 : page;

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
            venue_name,
            primary_performer_name,
            llm_result
          ),
          events (
            web_path,
            local_date
          )
        `,
          { count: "exact" },
        );

      // Apply filters - handling both main table and joined table fields
      if (filters?.items?.length) {
        for (const filter of filters.items) {
          const { field, operator, value } = filter;
          
          // Skip empty values
          if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
            continue;
          }

          const mappedField = TRADES_FIELD_MAPPING[field] || field;
          const columnType = TRADES_COLUMN_TYPES[field];
          
          // For joined table fields, we need to use the special syntax
          if (mappedField.includes('.')) {
            // Supabase syntax for filtering joined tables: relation.column.operator.value
            const [relation, column] = mappedField.split('.');
            
            // Apply the appropriate filter based on operator and type
            if (columnType === "dateTime" || columnType === "number") {
              // For numeric/date comparisons
              switch (operator) {
                case "equals":
                case "=":
                  query = query.filter(`${relation}.${column}`, 'eq', value);
                  break;
                case ">=":
                case "greaterThanOrEqual":
                  query = query.filter(`${relation}.${column}`, 'gte', value);
                  break;
                case "<=":
                case "lessThanOrEqual":
                  query = query.filter(`${relation}.${column}`, 'lte', value);
                  break;
                case ">":
                case "greaterThan":
                  query = query.filter(`${relation}.${column}`, 'gt', value);
                  break;
                case "<":
                case "lessThan":
                  query = query.filter(`${relation}.${column}`, 'lt', value);
                  break;
                default:
                  query = query.filter(`${relation}.${column}`, 'eq', value);
              }
            } else {
              // For text columns
              switch (operator) {
                case "contains":
                  query = query.filter(`${relation}.${column}`, 'ilike', `%${value}%`);
                  break;
                case "equals":
                case "=":
                  query = query.filter(`${relation}.${column}`, 'eq', value);
                  break;
                case "startsWith":
                  query = query.filter(`${relation}.${column}`, 'ilike', `${value}%`);
                  break;
                case "endsWith":
                  query = query.filter(`${relation}.${column}`, 'ilike', `%${value}`);
                  break;
                case "isAnyOf":
                  if (Array.isArray(value)) {
                    query = query.filter(`${relation}.${column}`, 'in', `(${value.join(',')})`);
                  }
                  break;
                default:
                  query = query.filter(`${relation}.${column}`, 'ilike', `%${value}%`);
              }
            }
          } else {
            // For main table fields, apply directly
            if (columnType === "dateTime" || columnType === "number") {
              switch (operator) {
                case "equals":
                case "=":
                  query = query.eq(mappedField, value);
                  break;
                case ">=":
                case "greaterThanOrEqual":
                  query = query.gte(mappedField, value);
                  break;
                case "<=":
                case "lessThanOrEqual":
                  query = query.lte(mappedField, value);
                  break;
                case ">":
                case "greaterThan":
                  query = query.gt(mappedField, value);
                  break;
                case "<":
                case "lessThan":
                  query = query.lt(mappedField, value);
                  break;
                default:
                  query = query.eq(mappedField, value);
              }
            } else {
              switch (operator) {
                case "contains":
                  query = query.ilike(mappedField, `%${value}%`);
                  break;
                case "equals":
                case "=":
                  query = query.eq(mappedField, value);
                  break;
                case "startsWith":
                  query = query.ilike(mappedField, `${value}%`);
                  break;
                case "endsWith":
                  query = query.ilike(mappedField, `%${value}`);
                  break;
                case "isAnyOf":
                  if (Array.isArray(value)) {
                    query = query.in(mappedField, value);
                  }
                  break;
                default:
                  query = query.ilike(mappedField, `%${value}%`);
              }
            }
          }
        }
      }

      // Handle sorting - only apply main table sorts to the query
      // Joined table sorts will be handled client-side after data fetch
      if (mainTableSorts?.length) {
        for (const sort of mainTableSorts) {
          const mappedField = TRADES_FIELD_MAPPING[sort.field] || sort.field;
          query = query.order(mappedField, {
            ascending: sort.sort === "asc",
          }) as typeof query;
        }
        
        // Add secondary sort on created_at for consistency
        const hasCreatedAtSort = mainTableSorts.some(s => s.field === 'created_at');
        if (!hasCreatedAtSort) {
          query = query.order('created_at', { ascending: false }) as typeof query;
        }
      } else if (!hasJoinedTableSort) {
        // Default sort by created_at descending when no sort is specified
        query = query.order('created_at', { ascending: false }) as typeof query;
      }

      query = applyPagination(query as any, fetchPage, fetchPageSize) as typeof query;

      const { data, error, count } = await query;

      if (error) {
        console.error("Supabase query error:", error);
        throw new Error(getErrorMessage(error));
      }

      // Flatten event_analysis_logs fields to top level for DataGrid
      let flattenedData = (data || []).map((row: any) => ({
        ...row,
        event_name: row.event_analysis_logs?.event_name ?? "-",
        local_date: row.events?.local_date ?? null,
        venue_name: row.event_analysis_logs?.venue_name ?? "-",
        primary_performer_name: row.event_analysis_logs?.primary_performer_name ?? "-",
        llm_result: row.event_analysis_logs?.llm_result ?? null,
        vs_web_path: row.events?.web_path ?? null,
        llm_result_comment: row.llm_result_comment ?? null,
      }));

      // Warn if we're doing client-side sorting but hit the fetch limit
      if (hasJoinedTableSort && count && count > fetchPageSize) {
        console.warn(
          `Sorting by joined table fields with ${count} total records but only fetched ${fetchPageSize}. ` +
          `Results may be incomplete. Consider increasing fetchPageSize or denormalizing these fields.`
        );
      }

      // Client-side sorting for joined table fields
      if (hasJoinedTableSort && joinedTableSorts.length > 0) {
        flattenedData.sort((a: any, b: any) => {
          // Apply joined table sorts first
          for (const sort of joinedTableSorts) {
            const aVal = a[sort.field];
            const bVal = b[sort.field];
            
            // Handle null/undefined
            if (aVal == null && bVal == null) continue;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            
            // Compare values
            let comparison = 0;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              // For date strings, try parsing as dates first
              if (sort.field === 'local_date' || TRADES_COLUMN_TYPES[sort.field] === 'dateTime') {
                const aDate = new Date(aVal);
                const bDate = new Date(bVal);
                if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
                  comparison = aDate.getTime() - bDate.getTime();
                } else {
                  comparison = aVal.localeCompare(bVal);
                }
              } else {
                comparison = aVal.localeCompare(bVal);
              }
            } else if (aVal instanceof Date && bVal instanceof Date) {
              comparison = aVal.getTime() - bVal.getTime();
            } else if (typeof aVal === 'number' && typeof bVal === 'number') {
              comparison = aVal - bVal;
            } else {
              comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            }
            
            if (comparison !== 0) {
              return sort.sort === 'asc' ? comparison : -comparison;
            }
          }
          
          // Apply main table sorts as secondary sorts
          for (const sort of mainTableSorts) {
            const aVal = a[sort.field];
            const bVal = b[sort.field];
            
            if (aVal == null && bVal == null) continue;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            
            let comparison = 0;
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              comparison = aVal.localeCompare(bVal);
            } else if (aVal instanceof Date && bVal instanceof Date) {
              comparison = aVal.getTime() - bVal.getTime();
            } else if (typeof aVal === 'number' && typeof bVal === 'number') {
              comparison = aVal - bVal;
            } else {
              comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            }
            
            if (comparison !== 0) {
              return sort.sort === 'asc' ? comparison : -comparison;
            }
          }
          
          // Final fallback: sort by id descending for consistency
          return (b.id || 0) - (a.id || 0);
        });

        // Apply client-side pagination after sorting
        const startIdx = page * pageSize;
        const endIdx = startIdx + pageSize;
        flattenedData = flattenedData.slice(startIdx, endIdx);
      }

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
