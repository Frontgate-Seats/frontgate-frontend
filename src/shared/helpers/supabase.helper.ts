import supabaseClient from "../../clients/supabase.client";
import type { DataGridQueryOptions } from "../types/mui.type";
import { buildSupabaseQuery } from "../utils/supabase.util";

// Response type
export interface DatabaseResponse<T = any> {
  data: T[];
  total: number;
}

export interface FunctionResponse<T = any> {
  data: T[];
  total: number;
}

// Options type
export interface DatabaseOptions extends DataGridQueryOptions {
  searchFields?: string[];
  selectFields?: string;
}

// Authentication utilities
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
};

export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
};

export const getAuthHeaders = async () => {
  const session = await getCurrentSession();

  if (!session?.access_token) {
    throw new Error("No valid session found");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    apikey: session.access_token,
  };
};

// Main database fetcher with automatic auth
export const getDBData = async (
  tableName: string,
  options: DatabaseOptions = {},
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
    // Ensure user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const baseQuery = supabaseClient
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

// Supabase function invoker with automatic auth
export const invokeFunction = async (
  functionName: string,
  options: DatabaseOptions = {},
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
): Promise<FunctionResponse> => {
  try {
    // Ensure user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabaseClient.functions.invoke(
      functionName,
      {
        body: options,
        method,
      },
    );

    if (error) {
      console.error(`Supabase function error for ${functionName}:`, error);
      throw new Error(`Supabase function error: ${error.message}`);
    }

    return {
      data: data || [],
      total: data.count || 0,
    };
  } catch (error) {
    console.error(`Failed to invoke function ${functionName}:`, error);
    throw error;
  }
};
