import supabase from "../../clients/supabase.client";
import type { DataGridQueryOptions } from "../types/mui.type";
import { buildSupabaseQuery } from "../utils/supabase.util";

// Response type
export interface DatabaseResponse<T = any> {
  data: T[];
  total: number;
}

// Options type
export interface DatabaseOptions extends DataGridQueryOptions {
  searchFields?: string[];
  selectFields?: string;
}

// Main database fetcher
export const getDBData = async (
  tableName: string,
  options: DatabaseOptions = {}
): Promise<DatabaseResponse> => {
  const {
    page = 0,
    pageSize = 25,
    sortFields,
    filters,
    search,
    searchFields,
    selectFields = "*",
  } = options;

  try {
    const baseQuery = supabase
      .from(tableName)
      .select(selectFields, { count: "exact" });

    const query = buildSupabaseQuery(baseQuery, {
      search,
      searchFields,
      filters,
      sortFields,
      page,
      pageSize,
    });

    const { data, error, count } = await query;

    if (error) {
      console.error(`Database error for table ${tableName}:`, error);
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error(`Failed to fetch data from ${tableName}:`, error);
    throw error;
  }
};
