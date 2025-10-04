import type { GridFilterModel, GridSortModel } from "@mui/x-data-grid";

export type DataGridQueryOptions = {
  page?: number;
  pageSize?: number;
  sortFields?: GridSortModel;
  filters?: GridFilterModel;
  search?: string; 
};
