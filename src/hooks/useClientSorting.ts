import * as React from "react";
import type { GridSortModel } from "@mui/x-data-grid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import moment from "moment";

interface UseSortingProps<T = any> {
  data: T[];
  columns: CustomGridColDef[];
  initialSortModel?: GridSortModel;
}

interface UseSortingReturn<T = any> {
  sortModel: GridSortModel;
  setSortModel: React.Dispatch<React.SetStateAction<GridSortModel>>;
  sortedRows: T[];
}

export function useSorting<T = any>({
  data,
  columns,
  initialSortModel = [],
}: UseSortingProps<T>): UseSortingReturn<T> {
  
  const [sortModel, setSortModel] = React.useState<GridSortModel>(
    initialSortModel
  );

  const sortedRows = React.useMemo(() => {
    if (!sortModel?.length) return data;

    const { field, sort } = sortModel[0];
    return [...data].sort((a, b) => {
      const aValue = a[field as keyof T];
      const bValue = b[field as keyof T];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle different data types
      const col = columns.find((c) => c.field === field);
      const colType = col?.type || "string";

      let comparison = 0;

      switch (colType) {
        case "number": {
          const numA = Number(aValue);
          const numB = Number(bValue);
          comparison = numA - numB;
          break;
        }
        case "date":
        case "dateTime": {
          const dateA = moment(aValue as any);
          const dateB = moment(bValue as any);
          if (dateA.isValid() && dateB.isValid()) {
            comparison = dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
          } else {
            comparison = String(aValue).localeCompare(String(bValue));
          }
          break;
        }
        case "boolean": {
          const boolA = Boolean(aValue);
          const boolB = Boolean(bValue);
          comparison = boolA === boolB ? 0 : boolA ? 1 : -1;
          break;
        }
        default: {
          comparison = String(aValue).localeCompare(String(bValue));
          break;
        }
      }

      return sort === "asc" ? comparison : -comparison;
    });
  }, [data, sortModel, columns]);

  return {
    sortModel,
    setSortModel,
    sortedRows,
  };
}