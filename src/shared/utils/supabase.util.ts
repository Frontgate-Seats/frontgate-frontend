import type { GridFilterModel, GridSortModel, GridFilterItem } from '@mui/x-data-grid';

// Supabase query interface - covers the methods we use
interface SupabaseQuery {
  ilike: (column: string, pattern: string) => SupabaseQuery;
  eq: (column: string, value: any) => SupabaseQuery;
  is: (column: string, value: null) => SupabaseQuery;
  not: (column: string, operator: string, value: any) => SupabaseQuery;
  in: (column: string, values: any[]) => SupabaseQuery;
  gte: (column: string, value: any) => SupabaseQuery;
  lte: (column: string, value: any) => SupabaseQuery;
  gt: (column: string, value: any) => SupabaseQuery;
  lt: (column: string, value: any) => SupabaseQuery;
  neq: (column: string, value: any) => SupabaseQuery;
  or: (filters: string) => SupabaseQuery;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQuery;
  range: (from: number, to: number) => SupabaseQuery;
}

// Types
export type FilterValue = string | number | boolean | null | undefined | (string | number | boolean | null)[];

export interface QueryOptions {
  search?: string;
  searchFields?: string[];
  filters?: GridFilterModel;
  sortFields?: GridSortModel;
  page?: number;
  pageSize?: number;
}

// Utility functions
export const isEmptyFilterValue = (value: FilterValue): boolean => {
  return (
    value == null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0) ||
    (Array.isArray(value) && value.every((item) => item == null || item === ""))
  );
};

// Apply single filter
export const applySingleFilter = <T extends SupabaseQuery>(query: T, filter: GridFilterItem): T => {
  const { field, operator, value } = filter;
  
  if (isEmptyFilterValue(value) || !field || !operator) {
    return query;
  }

  switch (operator) {
    case "contains":
      return query.ilike(field, `%${value}%`) as T;
    case "equals":
      return query.eq(field, value) as T;
    case "startsWith":
      return query.ilike(field, `${value}%`) as T;
    case "endsWith":
      return query.ilike(field, `%${value}`) as T;
    case "isEmpty":
      return query.is(field, null) as T;
    case "isNotEmpty":
      return query.not(field, "is", null) as T;
    case "isAnyOf":
      return Array.isArray(value) ? (query.in(field, value) as T) : query;
    case ">=":
    case "greaterThanOrEqual":
      return query.gte(field, value) as T;
    case "<=":
    case "lessThanOrEqual":
      return query.lte(field, value) as T;
    case ">":
    case "greaterThan":
      return query.gt(field, value) as T;
    case "<":
    case "lessThan":
      return query.lt(field, value) as T;
    case "!=":
    case "notEquals":
      return query.neq(field, value) as T;
    case "onOrAfter":
      return query.gte(field, value) as T;
    case "onOrBefore":
      return query.lte(field, value) as T;
    case "after":
      return query.gt(field, value) as T;
    case "before":
      return query.lt(field, value) as T;
    case "is":
      return query.eq(field, value) as T;
    default:
      return query.ilike(field, `%${value}%`) as T;
  }
};

// Apply filters
export const applyFilters = <T extends SupabaseQuery>(query: T, filters?: GridFilterModel): T => {
  if (!filters?.items?.length) return query;

  return filters.items.reduce((acc, filter) => 
    applySingleFilter(acc, filter), query
  );
};

// Apply search
export const applySearch = <T extends SupabaseQuery>(
  query: T,
  search: string,
  searchFields: string[]
): T => {
  if (!search?.trim()) return query;
  
  const searchConditions = searchFields
    .map(field => `${field}.ilike.%${search}%`)
    .join(',');
  
  return query.or(searchConditions) as T;
};

// Apply sorting
export const applySorting = <T extends SupabaseQuery>(
  query: T,
  sortFields?: GridSortModel
): T => {
  if (!sortFields?.length) return query;

  return sortFields.reduce((acc, sort) => 
    acc.order(sort.field, { ascending: sort.sort === "asc" }) as T, query
  );
};

// Apply pagination
export const applyPagination = <T extends SupabaseQuery>(
  query: T,
  page: number,
  pageSize: number
): T => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to) as T;
};

// Convert DataGrid filters (no conversion needed now)
export const convertDataGridFilters = (filterModel: GridFilterModel | undefined): GridFilterModel | undefined => {
  return filterModel?.items?.length ? filterModel : undefined;
};

// Convert GridSortModel to our format (no conversion needed now)
const convertSortFields = (sortFields?: GridSortModel): GridSortModel | undefined => {
  if (!sortFields?.length) return undefined;
  
  return sortFields.filter(sort => sort.sort);
};

// Main query builder
export const buildSupabaseQuery = <T extends SupabaseQuery>(
  baseQuery: T,
  options: QueryOptions = {}
): T => {
  let query = baseQuery;

  // Convert DataGrid formats internally
  const convertedFilters = convertDataGridFilters(options.filters);
  const convertedSortFields = convertSortFields(options.sortFields);

  // Apply search
  if (options.search && options.searchFields) {
    query = applySearch(query, options.search, options.searchFields);
  }

  // Apply filters
  query = applyFilters(query, convertedFilters);

  // Apply sorting
  query = applySorting(query, convertedSortFields);

  // Apply pagination
  if (options.page !== undefined && options.pageSize !== undefined) {
    query = applyPagination(query, options.page, options.pageSize);
  }

  return query;
};