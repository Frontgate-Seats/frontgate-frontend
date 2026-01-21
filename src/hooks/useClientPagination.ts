import * as React from "react";
import type { GridPaginationModel } from "@mui/x-data-grid";

interface UsePaginationProps<T = any> {
  data: T[];
  initialPaginationModel?: GridPaginationModel;
  resetOnDataChange?: boolean;
}

interface UsePaginationReturn<T = any> {
  paginationModel: GridPaginationModel;
  setPaginationModel: React.Dispatch<React.SetStateAction<GridPaginationModel>>;
  paginatedRows: T[];
  totalRows: number;
}

export function usePagination<T = any>({
  data,
  initialPaginationModel = { page: 0, pageSize: 25 },
  resetOnDataChange = true,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>(
    initialPaginationModel
  );

  const paginatedRows = React.useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    return data.slice(start, end);
  }, [data, paginationModel]);

  // Reset pagination when data changes (optional)
  React.useEffect(() => {
    if (resetOnDataChange) {
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    }
  }, [data.length, resetOnDataChange]);

  return {
    paginationModel,
    setPaginationModel,
    paginatedRows,
    totalRows: data.length,
  };
}