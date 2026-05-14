import * as React from "react";
import type {
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from "@mui/x-data-grid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import moment from "moment";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Optional external state override.  When provided, useClientFilters uses
 * these values + setters instead of its own internal useState, so the caller
 * (e.g. a page using useDataGridQueryParams) fully controls the state.
 */
interface ExternalState {
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;
  filterModel: GridFilterModel;
  setPaginationModel: React.Dispatch<React.SetStateAction<GridPaginationModel>>;
  setSortModel: React.Dispatch<React.SetStateAction<GridSortModel>>;
  setFilterModel: React.Dispatch<React.SetStateAction<GridFilterModel>>;
}

interface UseClientFiltersProps<T = any> {
  data: T[];
  columns: CustomGridColDef[];
  initialPaginationModel?: GridPaginationModel;
  initialSortModel?: GridSortModel;
  initialFilterModel?: GridFilterModel;
  /** Pass the return value of useDataGridQueryParams to sync state with URL. */
  externalState?: ExternalState;
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useClientFilters<T = any>({
  data,
  columns,
  initialPaginationModel = { page: 0, pageSize: 25 },
  initialSortModel = [],
  initialFilterModel = { items: [] },
  externalState,
}: UseClientFiltersProps<T>): UseClientFiltersReturn<T> {
  // ── Internal state (used when no externalState is provided) ───────────────

  const [internalPaginationModel, setInternalPaginationModel] =
    React.useState<GridPaginationModel>(initialPaginationModel);

  const [internalSortModel, setInternalSortModel] =
    React.useState<GridSortModel>(initialSortModel);

  const [internalFilterModel, setInternalFilterModel] =
    React.useState<GridFilterModel>(initialFilterModel);

  // ── Pick external or internal state ───────────────────────────────────────

  const paginationModel = externalState
    ? externalState.paginationModel
    : internalPaginationModel;
  const setPaginationModel = externalState
    ? externalState.setPaginationModel
    : setInternalPaginationModel;

  const sortModel = externalState ? externalState.sortModel : internalSortModel;
  const setSortModel = externalState
    ? externalState.setSortModel
    : setInternalSortModel;

  const filterModel = externalState
    ? externalState.filterModel
    : internalFilterModel;
  const setFilterModel = externalState
    ? externalState.setFilterModel
    : setInternalFilterModel;

  // ── Filtered rows ─────────────────────────────────────────────────────────

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
              return !!(fieldValue && String(fieldValue).trim() !== "");
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
            if (operator === "is") return fv.isSame(val, "day");
            if (operator === "not") return !fv.isSame(val, "day");
            if (operator === "after") return fv.isAfter(val, "day");
            if (operator === "before") return fv.isBefore(val, "day");
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
              return !!(fieldValue && String(fieldValue).trim() !== "");
            }
            return String(fieldValue ?? "") === String(value);
          }

          // -------------------- BOOLEAN --------------------
          case "boolean": {
            const boolValue = Boolean(fieldValue);
            const filterBoolValue = value === "true" || value === true;
            if (operator === "is") return boolValue === filterBoolValue;
            return boolValue === filterBoolValue;
          }
        }
      }),
    );
  }, [data, filterModel, columns]);

  // ── Sorted rows ───────────────────────────────────────────────────────────

  const sortedRows = React.useMemo(() => {
    if (!sortModel?.length) return filteredRows;

    const { field, sort } = sortModel[0];
    return [...filteredRows].sort((a, b) => {
      const aValue = a[field as keyof T];
      const bValue = b[field as keyof T];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const col = columns.find((c) => c.field === field);
      const colType = col?.type || "string";
      let comparison = 0;

      switch (colType) {
        case "number": {
          comparison = Number(aValue) - Number(bValue);
          break;
        }
        case "date":
        case "dateTime": {
          const dateA = moment(aValue as any);
          const dateB = moment(bValue as any);
          if (dateA.isValid() && dateB.isValid()) {
            comparison = dateA.isBefore(dateB)
              ? -1
              : dateA.isAfter(dateB)
                ? 1
                : 0;
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

  // ── Paginated rows ────────────────────────────────────────────────────────

  const paginatedRows = React.useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    return sortedRows.slice(start, end);
  }, [sortedRows, paginationModel]);

  // ── Reset page to 0 on filter / sort change (internal state only) ─────────
  // When externalState is used, useDataGridQueryParams already handles this.

  React.useEffect(() => {
    if (!externalState) {
      setInternalPaginationModel((prev) => ({ ...prev, page: 0 }));
    }
  }, [filterModel, sortModel]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    paginationModel,
    sortModel,
    filterModel,
    setPaginationModel,
    setSortModel,
    setFilterModel,
    filteredRows,
    sortedRows,
    paginatedRows,
    totalRows: data.length,
    totalFilteredRows: filteredRows.length,
  };
}
