import * as React from "react";
import { useSearchParams } from "react-router-dom";
import type {
  GridFilterItem,
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";
import type { CustomGridColDef } from "../shared/types/mui.type";

// ─── Operator inference ───────────────────────────────────────────────────────

function getColumn(field: string, columns: CustomGridColDef[]): CustomGridColDef | undefined {
  return columns.find((c) => c.field === field);
}

function getColumnType(field: string, columns: CustomGridColDef[]): string {
  return getColumn(field, columns)?.type ?? "string";
}

/** URL param key for a field — uses urlParamName if set, otherwise field name */
function getParamKey(field: string, columns: CustomGridColDef[]): string {
  return getColumn(field, columns)?.urlParamName ?? field;
}

/** Reverse lookup: given a URL param key, find the column's actual field name */
function getFieldFromParamKey(paramKey: string, columns: CustomGridColDef[]): string {
  const col = columns.find(
    (c) => (c.urlParamName ?? c.field) === paramKey,
  );
  return col?.field ?? paramKey;
}

// ─── Serialization: filterModel → URLSearchParams ─────────────────────────────
//
// Rules:
//   string / singleSelect  →  ?field=value
//   number (single)        →  ?field=value
//   number (range)         →  ?field=min,max   (either side can be empty: ",500" or "100,")
//   date / dateTime range  →  ?field=from,to   (either side can be empty)
//
// Default filter items (from defaultFilterModel) are NOT written to the URL.

function filterModelToParams(
  model: GridFilterModel,
  defaultModel: GridFilterModel,
  columns: CustomGridColDef[],
): URLSearchParams {
  const params = new URLSearchParams();

  if (!model.items?.length) return params;

  // Group items by field so we can combine range pairs
  const byField: Record<string, GridFilterItem[]> = {};
  for (const item of model.items) {
    if (!byField[item.field]) byField[item.field] = [];
    byField[item.field].push(item);
  }

  for (const [field, items] of Object.entries(byField)) {
    const colType = getColumnType(field, columns);
    const paramKey = getParamKey(field, columns); // use urlParamName if set

    if (colType === "date" || colType === "dateTime") {
      const from = items.find(
        (i) => i.operator === "onOrAfter" || i.operator === ">=",
      );
      const to = items.find(
        (i) => i.operator === "onOrBefore" || i.operator === "<=",
      );

      const fromVal = from?.value ?? "";
      const toVal = to?.value ?? "";

      const defaultItems = defaultModel.items.filter((i) => i.field === field);
      const defaultFrom = defaultItems.find(
        (i) => i.operator === "onOrAfter" || i.operator === ">=",
      );
      const defaultTo = defaultItems.find(
        (i) => i.operator === "onOrBefore" || i.operator === "<=",
      );

      const sameAsDefault =
        (defaultFrom?.value ?? "") === fromVal &&
        (defaultTo?.value ?? "") === toVal;

      if (!sameAsDefault && (fromVal || toVal)) {
        params.set(paramKey, `${fromVal},${toVal}`);
      }
    } else if (colType === "number") {
      const rangeMin = items.find(
        (i) => i.operator === ">=" || i.operator === "greaterThanOrEqual",
      );
      const rangeMax = items.find(
        (i) => i.operator === "<=" || i.operator === "lessThanOrEqual",
      );

      if (rangeMin || rangeMax) {
        const minVal = rangeMin?.value ?? "";
        const maxVal = rangeMax?.value ?? "";

        const defaultItems = defaultModel.items.filter(
          (i) => i.field === field,
        );
        const defaultMin = defaultItems.find(
          (i) => i.operator === ">=" || i.operator === "greaterThanOrEqual",
        );
        const defaultMax = defaultItems.find(
          (i) => i.operator === "<=" || i.operator === "lessThanOrEqual",
        );

        const sameAsDefault =
          (defaultMin?.value ?? "") === minVal &&
          (defaultMax?.value ?? "") === maxVal;

        if (!sameAsDefault && (minVal !== "" || maxVal !== "")) {
          params.set(paramKey, `${minVal},${maxVal}`);
        }
      } else {
        const single = items.find((i) => i.operator === "equals");
        if (single?.value != null && single.value !== "") {
          const defaultItem = defaultModel.items.find(
            (i) => i.field === field && i.operator === "equals",
          );
          if (defaultItem?.value !== single.value) {
            params.set(paramKey, String(single.value));
          }
        }
      }
    } else {
      const item = items[0];
      if (item?.value != null && item.value !== "") {
        const defaultItem = defaultModel.items.find((i) => i.field === field);
        if (defaultItem?.value !== item.value) {
          params.set(paramKey, String(item.value));
        }
      }
    }
  }

  return params;
}

// ─── Deserialization: URLSearchParams → filterModel ───────────────────────────

function paramsToFilterItems(
  searchParams: URLSearchParams,
  columns: CustomGridColDef[],
): GridFilterItem[] {
  const items: GridFilterItem[] = [];

  searchParams.forEach((value, paramKey) => {
    if (!value) return;

    // Resolve the actual field name (handles urlParamName → field mapping)
    const field = getFieldFromParamKey(paramKey, columns);
    const col = getColumn(field, columns);
    const colType = col?.type ?? "string";

    if (colType === "date" || colType === "dateTime") {
      // "from,to" — either side may be empty
      const commaIdx = value.indexOf(",");
      const from = commaIdx === -1 ? value : value.slice(0, commaIdx);
      const to   = commaIdx === -1 ? ""    : value.slice(commaIdx + 1);
      if (from) items.push({ field, operator: "onOrAfter",  value: from });
      if (to)   items.push({ field, operator: "onOrBefore", value: to });
    } else if (colType === "number") {
      if (value.includes(",")) {
        // Range: "min,max"
        const commaIdx = value.indexOf(",");
        const minStr = value.slice(0, commaIdx);
        const maxStr = value.slice(commaIdx + 1);
        // Parse to actual numbers so sliders and comparisons work correctly
        if (minStr) items.push({ field, operator: ">=", value: Number(minStr) });
        if (maxStr) items.push({ field, operator: "<=", value: Number(maxStr) });
      } else {
        // Single value — use filterOperator if set, otherwise "equals"
        const operator = col?.filterOperator ?? "equals";
        items.push({ field, operator, value: Number(value) });
      }
    } else if (colType === "singleSelect") {
      const operator = col?.filterOperator ?? "is";
      items.push({ field, operator, value });
    } else {
      // string — use filterOperator if set, otherwise "contains"
      const operator = col?.filterOperator ?? "contains";
      items.push({ field, operator, value });
    }
  });

  return items;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseDataGridQueryParamsOptions {
  columns?: CustomGridColDef[];
  defaultPaginationModel?: GridPaginationModel;
  defaultSortModel?: GridSortModel;
  defaultFilterModel?: GridFilterModel;
}

export interface UseDataGridQueryParamsReturn {
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;
  filterModel: GridFilterModel;
  setPaginationModel: React.Dispatch<React.SetStateAction<GridPaginationModel>>;
  setSortModel: React.Dispatch<React.SetStateAction<GridSortModel>>;
  setFilterModel: React.Dispatch<React.SetStateAction<GridFilterModel>>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for the three useState calls that manage a DataGrid's
 * pagination / sort / filter state.
 *
 * Only the filter model is persisted in the URL using clean, readable params:
 *
 *   string/select  →  ?name=Taylor Swift
 *   number single  →  ?id=5964885
 *   number range   →  ?price=100,500
 *   date range     →  ?local_date=2026-01-01T00:00:00.000Z,2026-07-01T00:00:00.000Z
 *
 * Default filter values are NOT written to the URL.
 * Pagination and sort stay in local state only.
 */
export function useDataGridQueryParams({
  columns = [],
  defaultPaginationModel = { page: 0, pageSize: 25 },
  defaultSortModel = [],
  defaultFilterModel = { items: [] },
}: UseDataGridQueryParamsOptions = {}): UseDataGridQueryParamsReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  // Keep a stable ref to columns so effects always see the latest value
  // without needing columns in their dependency arrays.
  const columnsRef = React.useRef<CustomGridColDef[]>(columns);
  React.useEffect(() => {
    columnsRef.current = columns;
  });

  // Keep a stable ref to defaultFilterModel for the same reason.
  const defaultFilterRef = React.useRef<GridFilterModel>(defaultFilterModel);
  React.useEffect(() => {
    defaultFilterRef.current = defaultFilterModel;
  });

  // ── Read initial filter from URL once on mount ────────────────────────────
  const initialFilter = React.useMemo<GridFilterModel>(() => {
    const urlItems = paramsToFilterItems(searchParams, columnsRef.current);
    if (urlItems.length === 0) return defaultFilterRef.current;
    return { items: urlItems };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount

  // ── State ─────────────────────────────────────────────────────────────────
  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>(defaultPaginationModel);

  const [sortModel, setSortModel] =
    React.useState<GridSortModel>(defaultSortModel);

  const [filterModel, setFilterModel] =
    React.useState<GridFilterModel>(initialFilter);

  // ── Sync filter → URL (replace so we don't spam history) ─────────────────
  // We merge filter params into the existing search params so we don't wipe
  // unrelated params (e.g. route-level params set by the router).
  React.useEffect(() => {
    const filterParams = filterModelToParams(
      filterModel,
      defaultFilterRef.current,
      columnsRef.current,
    );

    setSearchParams(
      (prev) => {
        // Start from the current params so we preserve anything we don't own.
        const next = new URLSearchParams(prev);

        // Collect all param keys this hook currently "owns" (all possible
        // urlParamName / field keys from the columns config).
        const ownedKeys = new Set<string>(
          columnsRef.current.map((c) => c.urlParamName ?? c.field),
        );

        // Remove all owned keys first, then re-add only the active ones.
        ownedKeys.forEach((key) => next.delete(key));
        filterParams.forEach((value, key) => next.set(key, value));

        return next;
      },
      { replace: true },
    );
  }, [filterModel, setSearchParams]);

  // ── Reset page to 0 when filter changes (skip first render) ──────────────
  const skipFirstReset = React.useRef(true);
  React.useEffect(() => {
    if (skipFirstReset.current) {
      skipFirstReset.current = false;
      return;
    }
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [filterModel]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    paginationModel,
    sortModel,
    filterModel,
    setPaginationModel,
    setSortModel,
    setFilterModel,
  };
}
