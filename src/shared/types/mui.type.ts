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
}