import * as React from "react";
import type { 
  GridPaginationModel, 
  GridSortModel, 
  GridFilterModel 
} from "@mui/x-data-grid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import moment from "moment";

interface UseClientFiltersProps<T = any> {
  data: T[];
  columns: CustomGridColDef[];
  initialPaginationModel?: GridPaginationModel;
  initialSortModel?: GridSortModel;
  initialFilterModel?: GridFilterModel;
}

interface UseClientFiltersReturn<T = any> {
  // State
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;
  filterModel: GridFilterModel;
  
  // State setters
  setPaginationModel: React.Dispatch<React.SetStateAction<GridPaginationModel>>;
  setSortModel: React.Dispatch<React.SetStateAction<GridSortModel>>;
  setFilterModel: React.Dispatch<React.SetStateAction<GridFilterModel>>;
  
  // Processed data
  filteredRows: T[];
  sortedRows: T[];
  paginatedRows: T[];
  
  // Metadata
  totalRows: number;
  totalFilteredRows: number;
}

export function useClientFilters<T = any>({
  data,
  columns,
  initialPaginationModel = { page: 0, pageSize: 25 },
  initialSortModel = [],
  initialFilterModel = { items: [] },
}: UseClientFiltersProps<T>): UseClientFiltersReturn<T> {
  
  // State management
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>(
    initialPaginationModel
  );
  
  const [sortModel, setSortModel] = React.useState<GridSortModel>(
    initialSortModel
  );
  
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>(
    initialFilterModel
  );

  // Memoized filtered rows
  const filteredRows = React.useMemo(() => {
    if (!filterModel?.items?.length) return data;

    return data.filter((row) =>
      filterModel.items.every(({ field, operator, value }) => {
        if (value == null || value === "") return true;

        const col = columns.find((c) => c.field === field);
        const colType = col?.type || "string";
        const fieldValue = row[field as keyof T];

        switch (colType) {
          // -------------------- TEXT --------------------
          default: {
            if (operator === "contains") {
              return String(fieldValue ?? "")
                .toLowerCase()
                .includes(String(value).toLowerCase());
            }
            if (operator === "equals") {
              return (
                String(fieldValue ?? "").toLowerCase() ===
                String(value).toLowerCase()
              );
            }
            if (operator === "startsWith") {
              return String(fieldValue ?? "")
                .toLowerCase()
                .startsWith(String(value).toLowerCase());
            }
            if (operator === "endsWith") {
              return String(fieldValue ?? "")
                .toLowerCase()
                .endsWith(String(value).toLowerCase());
            }
            if (operator === "isEmpty") {
              return !fieldValue || String(fieldValue).trim() === "";
            }
            if (operator === "isNotEmpty") {
              return fieldValue && String(fieldValue).trim() !== "";
            }
            return true;
          }

          // -------------------- NUMBER --------------------
          case "number": {
            const fv = Number(fieldValue);
            const val = Number(value);
            if (isNaN(fv) || isNaN(val)) return false;

            if (operator === ">=") return fv >= val;
            if (operator === "<=") return fv <= val;
            if (operator === ">") return fv > val;
            if (operator === "<") return fv < val;
            if (operator === "equals") return fv === val;
            if (operator === "!=") return fv !== val;
            if (operator === "isEmpty") return fieldValue == null;
            if (operator === "isNotEmpty") return fieldValue != null;
            return true;
          }

          // -------------------- DATE --------------------
          case "date":
          case "dateTime": {
            const fv = moment(fieldValue as any);
            const val = moment(value);
            if (!fv.isValid() || !val.isValid()) return false;

            if (operator === "onOrAfter")
              return fv.isSame(val, "day") || fv.isAfter(val, "day");
            if (operator === "onOrBefore")
              return fv.isSame(val, "day") || fv.isBefore(val, "day");
            if (operator === "is")
              return fv.isSame(val, "day");
            if (operator === "not")
              return !fv.isSame(val, "day");
            if (operator === "after")
              return fv.isAfter(val, "day");
            if (operator === "before")
              return fv.isBefore(val, "day");
            if (operator === "isEmpty") return !fv.isValid();
            if (operator === "isNotEmpty") return fv.isValid();
            return true;
          }

          // -------------------- SINGLE SELECT --------------------
          case "singleSelect": {
            if (operator === "is") {
              return String(fieldValue ?? "") === String(value);
            }
            if (operator === "not") {
              return String(fieldValue ?? "") !== String(value);
            }
            if (operator === "isEmpty") {
              return !fieldValue || String(fieldValue).trim() === "";
            }
            if (operator === "isNotEmpty") {
              return fieldValue && String(fieldValue).trim() !== "";
            }
            return String(fieldValue ?? "") === String(value);
          }

          // -------------------- BOOLEAN --------------------
          case "boolean": {
            const boolValue = Boolean(fieldValue);
            const filterBoolValue = value === "true" || value === true;
            
            if (operator === "is") {
              return boolValue === filterBoolValue;
            }
            return boolValue === filterBoolValue;
          }
        }
      })
    );
  }, [data, filterModel, columns]);

  // Memoized sorted rows
  const sortedRows = React.useMemo(() => {
    if (!sortModel?.length) return filteredRows;

    const { field, sort } = sortModel[0];
    return [...filteredRows].sort((a, b) => {
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
  }, [filteredRows, sortModel, columns]);

  // Memoized paginated rows
  const paginatedRows = React.useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    return sortedRows.slice(start, end);
  }, [sortedRows, paginationModel]);

  // Reset pagination when filters or sorting change
  React.useEffect(() => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  }, [filterModel, sortModel]);

  return {
    // State
    paginationModel,
    sortModel,
    filterModel,
    
    // State setters
    setPaginationModel,
    setSortModel,
    setFilterModel,
    
    // Processed data
    filteredRows,
    sortedRows,
    paginatedRows,
    
    // Metadata
    totalRows: data.length,
    totalFilteredRows: filteredRows.length,
  };
}