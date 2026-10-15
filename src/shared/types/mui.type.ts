import type { ReactNode } from "react";
import type {
  GridColDef,
  GridFilterItem,
  GridFilterModel,
  GridSortModel,
} from "@mui/x-data-grid";

/**
 * A one-click filter shortcut shown as a toggle above the data grid.
 * Clicking it applies `items` to the filter model; clicking again clears them.
 */
export type QuickFilter = {
  /** Unique id, also used to detect whether the quick filter is active. */
  id: string;
  /** Toggle label, e.g. "Show Upcoming Open". */
  label: string;
  /** Filter items this quick filter applies when active. */
  items: GridFilterItem[];
  /**
   * When true, activating this quick filter REPLACES the entire filter model
   * with `items` (clearing every other filter). When turned off it replaces
   * the model with `itemsWhenInactive` (or clears all if that is omitted).
   * When false/omitted, it only toggles its own `items` and leaves other
   * filters untouched.
   */
  replaceAll?: boolean;
  /**
   * The filter model to fall back to when this (replaceAll) quick filter is
   * turned off. Omit to clear all filters on deselect.
   */
  itemsWhenInactive?: GridFilterItem[];
  /** Optional icon shown in the toggle. */
  icon?: ReactNode;
  /** Optional tooltip explaining what the toggle does. */
  tooltip?: string;
};

export type DataGridQueryOptions = {
  page?: number;
  pageSize?: number;
  sortFields?: GridSortModel;
  filters?: GridFilterModel;
  search?: string; 
};

export type CustomGridColDef = GridColDef & {
  min?: number;
  max?: number;
  /**
   * Custom URL query param name for this column's filter.
   * Defaults to the column's field name.
   * Use this when the field name would clash with a route param or
   * when you want a more descriptive name in the URL.
   * e.g. field="id" with urlParamName="listing_id" → ?listing_id=abc
   */
  urlParamName?: string;
  /**
   * Override the default filter operator used when reading this column's
   * value back from the URL.
   * Defaults are: string→"contains", number→"equals", singleSelect→"is",
   * date/dateTime→"onOrAfter"/"onOrBefore" (range).
   * e.g. filterOperator="equals" on a string column → exact match on reload.
   */
  filterOperator?: string;
}