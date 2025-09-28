import type { GridFilterModel } from "@mui/x-data-grid";

export type DataGridQueryOptions = {
  page: number;
  pageSize: number;
  sortField?: string; 
  sortOrder?: "asc" | "desc";
  filters?: GridFilterModel;
  search?: string; 
};
