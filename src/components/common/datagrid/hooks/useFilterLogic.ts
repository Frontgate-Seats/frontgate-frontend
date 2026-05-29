import { useCallback, useRef, useState, useEffect } from "react";
import type { GridFilterModel } from "@mui/x-data-grid";

interface UseFilterLogicProps {
  field: string;
  columnType?: string;
  filterModel: GridFilterModel;
  setFilterModel: React.Dispatch<React.SetStateAction<GridFilterModel>>;
  debounceMs?: number;
}

export const useFilterLogic = ({
  field,
  columnType,
  filterModel,
  setFilterModel,
  debounceMs = 300,
}: UseFilterLogicProps) => {
  const [localValue, setLocalValue] = useState<any>("");
  const timerRef = useRef<number | null>(null);

  // Sync filterModel to local state
  useEffect(() => {
    const items = filterModel.items || [];

    if (columnType === "number") {
      // Handle range filters for numbers
      const minItem = items.find(
        (item) =>
          item.field === field &&
          (item.operator === ">=" || item.operator === "greaterThanOrEqual")
      );
      const maxItem = items.find(
        (item) =>
          item.field === field &&
          (item.operator === "<=" || item.operator === "lessThanOrEqual")
      );

      if (minItem || maxItem) {
        setLocalValue([minItem?.value || null, maxItem?.value || null]);
      } else {
        const equalItem = items.find(
          (item) => item.field === field && item.operator === "equals"
        );
        setLocalValue(equalItem?.value || "");
      }
    } else if (columnType === "date" || columnType === "dateTime") {
      // Handle date range filters
      const fromItem = items.find(
        (item) =>
          item.field === field &&
          (item.operator === "onOrAfter" || item.operator === ">=")
      );
      const toItem = items.find(
        (item) =>
          item.field === field &&
          (item.operator === "onOrBefore" || item.operator === "<=")
      );

      if (fromItem || toItem) {
        setLocalValue([fromItem?.value || null, toItem?.value || null]);
      } else {
        setLocalValue("");
      }
    } else {
      // Handle simple filters (string, singleSelect)
      const item = items.find((item) => item.field === field);
      setLocalValue(item?.value || "");
    }
  }, [filterModel, field, columnType]);

  const updateFilter = useCallback(
    (value: any) => {
      setFilterModel((prev) => {
        const newItems = (prev.items || []).filter(
          (item) => item.field !== field
        );

        if (isEmptyValue(value)) {
          return { ...prev, items: newItems };
        }

        switch (columnType) {
          case "number":
            if (Array.isArray(value)) {
              const [min, max] = value;
              if (min != null) {
                newItems.push({
                  id: `${field}-min`,
                  field,
                  operator: ">=" as any,
                  value: min,
                });
              }
              if (max != null) {
                newItems.push({
                  id: `${field}-max`,
                  field,
                  operator: "<=" as any,
                  value: max,
                });
              }
            } else {
              newItems.push({
                id: `${field}-eq`,
                field,
                operator: "equals" as any,
                value,
              });
            }
            break;

          case "date":
          case "dateTime":
            if (Array.isArray(value)) {
              const [from, to] = value;
              if (from) {
                newItems.push({
                  id: `${field}-from`,
                  field,
                  operator: "onOrAfter" as any,
                  value: from,
                });
              }
              if (to) {
                newItems.push({
                  id: `${field}-to`,
                  field,
                  operator: "onOrBefore" as any,
                  value: to,
                });
              }
            }
            break;

          case "singleSelect":
            newItems.push({
              id: `${field}-${Date.now()}`,
              field,
              operator: "is" as any,
              value,
            });
            break;

          default:
            newItems.push({
              id: `${field}-${Date.now()}`,
              field,
              operator: "contains" as any,
              value,
            });
        }

        return { ...prev, items: newItems };
      });
    },
    [setFilterModel, field, columnType]
  );

  const handleChange = useCallback(
    (value: any) => {
      setLocalValue(value);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        updateFilter(value);
      }, debounceMs);
    },
    [updateFilter, debounceMs]
  );

  const commitNow = useCallback(
    (value: any) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      updateFilter(value);
    },
    [updateFilter]
  );

  // Clear any pending debounce timer on unmount to prevent state updates
  // on an unmounted component.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    localValue,
    setLocalValue,
    handleChange,
    commitNow,
  };
};

const isEmptyValue = (v: any): boolean =>
  v == null ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0) ||
  (Array.isArray(v) && v.every((item) => item == null || item === ""));
