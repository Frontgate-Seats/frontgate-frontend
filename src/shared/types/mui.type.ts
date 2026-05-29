import type { GridColDef, GridFilterModel, GridSortModel } from "@mui/x-data-grid";

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