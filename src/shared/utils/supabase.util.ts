import type {
  GridFilterModel,
  GridSortModel,
  GridFilterItem,
} from "@mui/x-data-grid";
import { getErrorMessage } from "./error.util";

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
  /** grid field -> MUI column type, so numeric/date columns never get `ilike` */
  columnTypes?: Record<string, string>;
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

  // For numeric/date/boolean columns, don't use text operators like ilike
  const isNumericOrDateColumn = 
    columnType === "number" || 
    columnType === "dateTime" ||
    columnType === "date" ||
    columnType === "boolean";

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
  } else if (columnType === "boolean") {
    // MUI singleSelect sends "true"/"false" strings — coerce to real booleans
    // so Supabase sends `eq.true` / `eq.false` to PostgREST.
    if (typeof cleanValue === "string") {
      processedValue = cleanValue.toLowerCase() === "true";
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
  query = applyFilters(query, convertedFilters, options.columnTypes);

  // Apply sorting
  query = applySorting(query, convertedSortFields);

  // Apply pagination
  if (options.page !== undefined && options.pageSize !== undefined) {
    query = applyPagination(query, options.page, options.pageSize);
  }

  return query;
};

// =============================================================================
// Grid query pipeline (shared by every DataGrid-backed API)
//
// One place that knows how to turn a MUI DataGrid query (filters + sort +
// pagination) into a Supabase query, including fields that live on an embedded
// (foreign) table.
//
// Why the field map is an allow-list: PostgREST answers an unknown column with
// `42703 column <table>_1.<col> does not exist`, which surfaces in the UI as a
// cryptic snackbar. Anything not declared in `fieldMap` is dropped here with a
// console warning instead of being forwarded to Postgres.
// =============================================================================

/** A single `{ field, sort }` entry of a GridSortModel. */
export type GridSortEntry = GridSortModel[number];

export interface GridQuerySpec {
  /**
   * Grid field -> PostgREST column path. Use `"relation.column"` for a field
   * that lives on an embedded table. Every filterable/sortable grid field must
   * be listed; unlisted fields are ignored.
   */
  fieldMap: Record<string, string>;
  /** Grid field -> MUI column type (`number` | `dateTime` | `date` | `boolean` | `string`). */
  columnTypes?: Record<string, string>;
  /** Applied last so pagination stays stable when the user's sort has ties. */
  defaultSort?: GridSortEntry;
  /** Columns used by the free-text `search` option. */
  searchFields?: string[];
  /**
   * PostgREST cannot order parent rows by an embedded table's column, so those
   * sorts fall back to fetching this many rows and sorting in the browser.
   */
  foreignSortFetchLimit?: number;
}

const warnedFields = new Set<string>();

const warnUnknownField = (context: string, field: string) => {
  const key = `${context}:${field}`;
  if (warnedFields.has(key)) return;
  warnedFields.add(key);
  console.warn(
    `[supabase] Ignoring ${context} on unmapped field "${field}". ` +
      `Add it to the GridQuerySpec fieldMap if the column exists.`,
  );
};

/** Resolve a grid field to its column path, or null when it is not mapped. */
export const resolveGridField = (
  field: string,
  spec: GridQuerySpec,
): string | null => spec.fieldMap[field] ?? null;

/** A column path on an embedded table, e.g. `events.local_date`. */
export const isForeignPath = (path: string): boolean => path.includes(".");

/**
 * Split sorts into ones Postgres can do and ones that need a client-side pass.
 * Unmapped fields are dropped.
 */
export const splitGridSorting = (
  sortFields: GridSortModel | undefined,
  spec: GridQuerySpec,
): { local: GridSortEntry[]; foreign: GridSortEntry[] } => {
  const local: GridSortEntry[] = [];
  const foreign: GridSortEntry[] = [];

  sortFields?.forEach((item) => {
    if (!item.sort) return;

    const path = resolveGridField(item.field, spec);
    if (!path) {
      warnUnknownField("sort", item.field);
      return;
    }

    (isForeignPath(path) ? foreign : local).push(item);
  });

  return { local, foreign };
};

/** Apply grid filters, mapping each field to its column path first. */
export const applyGridFilters = <T extends SupabaseQuery>(
  query: T,
  filters: GridFilterModel | undefined,
  spec: GridQuerySpec,
): T => {
  if (!filters?.items?.length) return query;

  return filters.items.reduce((acc, item) => {
    if (isEmptyFilterValue(item.value) || !item.field || !item.operator) {
      return acc;
    }

    const path = resolveGridField(item.field, spec);
    if (!path) {
      warnUnknownField("filter", item.field);
      return acc;
    }

    // Embedded-table filters use the same `column=op.value` form, so the
    // single operator switch in applySingleFilter covers both cases.
    return applySingleFilter(
      acc,
      { ...item, field: path },
      spec.columnTypes?.[item.field],
    );
  }, query);
};

/** Apply the sorts Postgres can handle, then the spec's tiebreaker. */
export const applyGridSorting = <T extends SupabaseQuery>(
  query: T,
  sortFields: readonly GridSortEntry[],
  spec: GridQuerySpec,
): T => {
  let next = sortFields.reduce((acc, item) => {
    const path = resolveGridField(item.field, spec);
    if (!path) return acc;
    return acc.order(path, { ascending: item.sort === "asc" }) as T;
  }, query);

  const tiebreaker = spec.defaultSort;
  if (tiebreaker && !sortFields.some((item) => item.field === tiebreaker.field)) {
    const path = resolveGridField(tiebreaker.field, spec) ?? tiebreaker.field;
    next = next.order(path, { ascending: tiebreaker.sort === "asc" }) as T;
  }

  return next;
};

const compareValues = (
  a: unknown,
  b: unknown,
  columnType?: string,
): number => {
  if (typeof a === "number" && typeof b === "number") return a - b;

  if (typeof a === "string" && typeof b === "string") {
    if (columnType === "dateTime" || columnType === "date") {
      const aTime = new Date(a).getTime();
      const bTime = new Date(b).getTime();
      if (!isNaN(aTime) && !isNaN(bTime)) return aTime - bTime;
    }
    return a.localeCompare(b);
  }

  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();

  return a === b ? 0 : (a as any) < (b as any) ? -1 : 1;
};

/** Sort already-flattened rows. Nulls last, `id` descending as final tiebreaker. */
export const sortGridRows = <T extends Record<string, any>>(
  rows: T[],
  sortFields: readonly GridSortEntry[],
  spec: GridQuerySpec,
): T[] =>
  [...rows].sort((a, b) => {
    for (const item of sortFields) {
      const aVal = a[item.field];
      const bVal = b[item.field];

      if (aVal == null && bVal == null) continue;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison = compareValues(aVal, bVal, spec.columnTypes?.[item.field]);
      if (comparison !== 0) return item.sort === "asc" ? comparison : -comparison;
    }

    return Number(b.id ?? 0) - Number(a.id ?? 0);
  });

export interface GridPageResult<T> {
  data: T[];
  total: number;
}

/**
 * Run a DataGrid query end to end: filter, sort, paginate, flatten.
 *
 * `baseQuery` must already carry `.select(..., { count: "exact" })`.
 * `flatten` lifts embedded rows onto the flat shape the grid binds to; it runs
 * before client-side sorting so foreign sorts read the flattened field.
 */
export const fetchGridPage = async <TRow, TOut extends Record<string, any>>(
  baseQuery: any,
  options: QueryOptions,
  spec: GridQuerySpec,
  flatten: (row: TRow) => TOut,
): Promise<GridPageResult<TOut>> => {
  const page = options.page ?? 0;
  const pageSize = options.pageSize ?? 25;

  const { local, foreign } = splitGridSorting(options.sortFields, spec);
  const needsClientSort = foreign.length > 0;

  const fetchPage = needsClientSort ? 0 : page;
  const fetchSize = needsClientSort
    ? spec.foreignSortFetchLimit ?? 1000
    : pageSize;

  let query = applyGridFilters(baseQuery, options.filters, spec);

  const searchFields = options.searchFields ?? spec.searchFields;
  if (options.search && searchFields?.length) {
    query = applySearch(query, options.search, searchFields);
  }

  query = applyGridSorting(query, local, spec);
  query = applyPagination(query, fetchPage, fetchSize);

  const { data, error, count } = await query;

  if (error) {
    console.error("Supabase query error:", error);
    throw new Error(getErrorMessage(error));
  }

  let rows = ((data ?? []) as TRow[]).map(flatten);

  if (needsClientSort) {
    if (count && count > fetchSize) {
      console.warn(
        `[supabase] Sorting by a foreign-table field across ${count} rows but only ${fetchSize} were fetched, ` +
          `so pages beyond the first ${fetchSize} rows are incomplete. A database view with the joined ` +
          `columns would move this sort server-side.`,
      );
    }

    rows = sortGridRows(rows, [...foreign, ...local], spec);
    const start = page * pageSize;
    rows = rows.slice(start, start + pageSize);
  }

  return { data: rows, total: count ?? 0 };
};
