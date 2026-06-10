import type {
  GridFilterModel,
  GridSortModel,
  GridFilterItem,
} from "@mui/x-data-grid";

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
export type FilterValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | (string | number | boolean | null)[];

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
export const applySingleFilter = <T extends SupabaseQuery>(
  query: T,
  filter: GridFilterItem,
  columnType?: string,
): T => {
  const { field, operator, value } = filter;

  if (isEmptyFilterValue(value) || !field || !operator) {
    return query;
  }

  // Sanitize and validate the value - remove any URL artifacts
  let cleanValue = value;
  if (typeof value === "string") {
    // Remove URL encoding artifacts like &, ?, = at the start
    cleanValue = value.replace(/^[&?=]+/, '').trim();
    
    // If the value still looks like a URL parameter (contains & or =), extract just the value
    if (cleanValue.includes('=')) {
      const parts = cleanValue.split('=');
      cleanValue = parts[parts.length - 1]; // Get the last part after =
    }
    if (cleanValue.includes('&')) {
      cleanValue = cleanValue.split('&')[0]; // Get the first part before &
    }
  }

  // For numeric/date columns, don't use text operators like ilike
  const isNumericOrDateColumn = 
    columnType === "number" || 
    columnType === "dateTime" ||
    columnType === "date";

  // Convert value to appropriate type
  let processedValue: any = cleanValue;
  if (columnType === "number") {
    if (typeof cleanValue === "string") {
      const numValue = Number(cleanValue);
      if (isNaN(numValue)) {
        console.warn(`Invalid numeric value for field "${field}": "${cleanValue}". Skipping filter.`);
        return query; // Skip this filter if value is invalid
      }
      processedValue = numValue;
    } else if (typeof cleanValue === "number") {
      processedValue = cleanValue;
    }
  }

  switch (operator) {
    case "contains":
      // Only use ilike for text columns
      return isNumericOrDateColumn 
        ? query.eq(field, processedValue) as T
        : query.ilike(field, `%${processedValue}%`) as T;
    case "equals":
    case "=":
      return query.eq(field, processedValue) as T;
    case "startsWith":
      return isNumericOrDateColumn
        ? query.eq(field, processedValue) as T
        : query.ilike(field, `${processedValue}%`) as T;
    case "endsWith":
      return isNumericOrDateColumn
        ? query.eq(field, processedValue) as T
        : query.ilike(field, `%${processedValue}`) as T;
    case "isEmpty":
      return query.is(field, null) as T;
    case "isNotEmpty":
      return query.not(field, "is", null) as T;
    case "isAnyOf":
      if (Array.isArray(processedValue)) {
        const arrayValue = columnType === "number"
          ? processedValue.map(v => {
              if (typeof v === "string") {
                const num = Number(v);
                return isNaN(num) ? null : num;
              }
              return v;
            }).filter(v => v !== null)
          : processedValue;
        return query.in(field, arrayValue) as T;
      }
      return query;
    case ">=":
    case "greaterThanOrEqual":
      return query.gte(field, processedValue) as T;
    case "<=":
    case "lessThanOrEqual":
      return query.lte(field, processedValue) as T;
    case ">":
    case "greaterThan":
      return query.gt(field, processedValue) as T;
    case "<":
    case "lessThan":
      return query.lt(field, processedValue) as T;
    case "!=":
    case "notEquals":
      return query.neq(field, processedValue) as T;
    case "onOrAfter":
      return query.gte(field, processedValue) as T;
    case "onOrBefore":
      return query.lte(field, processedValue) as T;
    case "after":
      return query.gt(field, processedValue) as T;
    case "before":
      return query.lt(field, processedValue) as T;
    case "is":
      return query.eq(field, processedValue) as T;
    default:
      // Default to equals for numeric/date columns, ilike for text
      return isNumericOrDateColumn
        ? query.eq(field, processedValue) as T
        : query.ilike(field, `%${processedValue}%`) as T;
  }
};

// Remap filter fields using a field mapping (for joined tables)
export const remapFilters = (
  filters?: GridFilterModel,
  fieldMapping?: Record<string, string>,
): GridFilterModel | undefined => {
  if (!filters?.items?.length || !fieldMapping) return filters;
  
  return {
    ...filters,
    items: filters.items.map((item) => ({
      ...item,
      field: fieldMapping[item.field] || item.field,
    })),
  };
};

// Remap sort fields using a field mapping (for joined tables)
export const remapSortFields = (
  sortFields?: GridSortModel,
  fieldMapping?: Record<string, string>,
): GridSortModel | undefined => {
  if (!sortFields?.length || !fieldMapping) return sortFields;
  
  return sortFields.map((item) => ({
    ...item,
    field: fieldMapping[item.field] || item.field,
  }));
};

// Apply filters with column type awareness
export const applyFilters = <T extends SupabaseQuery>(
  query: T,
  filters?: GridFilterModel,
  columnTypes?: Record<string, string>,
): T => {
  if (!filters?.items?.length) return query;

  return filters.items.reduce(
    (acc, filter) => {
      // For joined table fields (containing '.'), use the full path
      // For regular fields, use the field name as-is
      const fieldForTypeCheck = filter.field.includes('.') 
        ? filter.field.split('.').pop() || filter.field
        : filter.field;
      
      const columnType = columnTypes?.[fieldForTypeCheck];
      return applySingleFilter(acc, filter, columnType);
    },
    query,
  );
};

// Apply search
export const applySearch = <T extends SupabaseQuery>(
  query: T,
  search: string,
  searchFields: string[],
): T => {
  if (!search?.trim()) return query;

  const searchConditions = searchFields
    .map((field) => `${field}.ilike.%${search}%`)
    .join(",");

  return query.or(searchConditions) as T;
};

// Apply sorting (generic - for simple cases without foreign table sorting)
export const applySorting = <T extends SupabaseQuery>(
  query: T,
  sortFields?: GridSortModel,
): T => {
  if (!sortFields?.length) return query;

  return sortFields.reduce(
    (acc, sort) => acc.order(sort.field, { ascending: sort.sort === "asc" }) as T,
    query,
  );
};

// Apply pagination
export const applyPagination = <T extends SupabaseQuery>(
  query: T,
  page: number,
  pageSize: number,
): T => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to) as T;
};

// Convert DataGrid filters (no conversion needed now)
export const convertDataGridFilters = (
  filterModel: GridFilterModel | undefined,
): GridFilterModel | undefined => {
  return filterModel?.items?.length ? filterModel : undefined;
};

// Convert GridSortModel to our format (no conversion needed now)
const convertSortFields = (
  sortFields?: GridSortModel,
): GridSortModel | undefined => {
  if (!sortFields?.length) return undefined;

  return sortFields.filter((sort) => sort.sort);
};

// Main query builder
export const buildSupabaseQuery = <T extends SupabaseQuery>(
  baseQuery: T,
  options: QueryOptions = {},
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
