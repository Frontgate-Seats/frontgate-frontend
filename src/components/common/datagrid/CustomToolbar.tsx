// src/components/datagrid/DynamicFiltersToolbar.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Grid,
  Stack,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Slider,
  Divider,
  IconButton,
  Collapse,
  Box,
} from "@mui/material";
import { ExpandLess, ExpandMore, FilterAltOutlined } from "@mui/icons-material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import type {
  GridFilterModel,
  GridSingleSelectColDef,
  GridValueOptionsParams,
} from "@mui/x-data-grid";
import type { CustomGridColDef } from "../../../shared/types/mui.type";

// =======================
// Types & Constants
// =======================
interface DynamicFiltersToolbarProps {
  columns: CustomGridColDef[];
  filterModel: GridFilterModel;
  setFilterModel: React.Dispatch<React.SetStateAction<GridFilterModel>>;
  debounceMs?: number;
}

const DEFAULT_DEBOUNCE = 500;

// =======================
// Utils
// =======================
const normalizeOption = (opt: unknown): { value: string; label: string } => {
  if (opt == null) return { value: "", label: "" };
  if (typeof opt === "string" || typeof opt === "number")
    return { value: String(opt), label: String(opt) };
  if (typeof opt === "object") {
    const o = opt as { value?: string | number; label?: string };
    return {
      value: String(o.value ?? JSON.stringify(opt)),
      label: o.label ?? String(o.value ?? ""),
    };
  }
  return { value: String(opt), label: String(opt) };
};

const isEmptyValue = (v: any): boolean =>
  v == null ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

const safeDayjs = (v: any): Dayjs | null => {
  if (v == null || v === "") return null;
  const d = dayjs(v);
  return d.isValid() ? d : null;
};

// =======================
// Component
// =======================
const DynamicFiltersToolbar: React.FC<DynamicFiltersToolbarProps> = ({
  columns,
  filterModel,
  setFilterModel,
  debounceMs = DEFAULT_DEBOUNCE,
}) => {
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const timersRef = useRef<Record<string, number | null>>({});
  const [open, setOpen] = useState(false);

  // Sync filterModel → local state
  useEffect(() => {
    const vals: Record<string, any> = {};
    (filterModel.items || []).forEach((item) => {
      if (
        item?.field &&
        item.value !== undefined &&
        item.value !== null &&
        item.value !== ""
      ) {
        vals[item.field] = item.value;
      }
    });
    setLocalValues((prev) => ({ ...vals, ...prev }));
  }, [filterModel]);

  // Commit logic
  const commitNow = useCallback(
    (field: string, value: any, colType?: string) => {
      setFilterModel((prev) => {
        const newItems = (prev.items || []).filter((it) => it.field !== field);
        if (isEmptyValue(value)) return { ...prev, items: newItems };

        switch (colType) {
          case "number":
            if (Array.isArray(value)) {
              const [min, max] = value;
              if (min != null)
                newItems.push({
                  id: `${field}-min`,
                  field,
                  operator: ">=" as any,
                  value: min,
                });
              if (max != null)
                newItems.push({
                  id: `${field}-max`,
                  field,
                  operator: "<=" as any,
                  value: max,
                });
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
              if (from)
                newItems.push({
                  id: `${field}-from`,
                  field,
                  operator: "onOrAfter" as any,
                  value: from,
                });
              if (to)
                newItems.push({
                  id: `${field}-to`,
                  field,
                  operator: "onOrBefore" as any,
                  value: to,
                });
            }
            break;

          case "singleSelect":
            newItems.push({
              id: `${field}-${Date.now()}`,
              field,
              operator: "equals" as any,
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
    [setFilterModel]
  );

  // Debounced setter
  const setFieldValue = useCallback(
    (field: string, value: any, colType?: string) => {
      setLocalValues((prev) => ({ ...prev, [field]: value }));
      if (timersRef.current[field]) clearTimeout(timersRef.current[field]!);
      timersRef.current[field] = window.setTimeout(() => {
        commitNow(field, value, colType);
        timersRef.current[field] = null;
      }, debounceMs);
    },
    [commitNow, debounceMs]
  );

  const validColumns = columns.filter(
    (col) =>
      col.filterable !== false &&
      col.field &&
      col.headerName?.trim() &&
      col.type !== "actions"
  );

  // Render Filter Row
  const renderFilterRow = (col: CustomGridColDef) => {
    const val = localValues[col.field];

    switch (col.type) {
      case "number":
        return (
          <Paper
            key={col.field}
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
              }}
            >
              {col.headerName}
            </Typography>

            {typeof col.min === "number" && typeof col.max === "number" ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  type="number"
                  value={val?.[0] ?? col.min}
                  onChange={(e) =>
                    setFieldValue(col.field, [Number(e.target.value), val?.[1]], "number")
                  }
                  sx={{ width: 90 }}
                />
                <Slider
                  value={val ?? [col.min, col.max]}
                  onChange={(_, newVal) =>
                    Array.isArray(newVal) &&
                    setLocalValues((prev) => ({ ...prev, [col.field]: newVal }))
                  }
                  onChangeCommitted={(_, newVal) =>
                    Array.isArray(newVal) && commitNow(col.field, newVal, "number")
                  }
                  min={col.min}
                  max={col.max}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  type="number"
                  value={val?.[1] ?? col.max}
                  onChange={(e) =>
                    setFieldValue(col.field, [val?.[0], Number(e.target.value)], "number")
                  }
                  sx={{ width: 90 }}
                />
              </Stack>
            ) : (
              <TextField
                size="small"
                fullWidth
                type="number"
                value={val ?? ""}
                onChange={(e) => setFieldValue(col.field, e.target.value, "number")}
              />
            )}
          </Paper>
        );

      case "date":
      case "dateTime":{
        console.log(val)
        return (
          <Paper
            key={col.field}
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
              }}
            >
              {col.headerName}
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack direction="row" spacing={1}>
                <DatePicker
                  label="From"
                  value={val?.[0] ? safeDayjs(val?.[0]) : null}
                  onChange={(v) =>
                    setFieldValue(
                      col.field,
                      [v ? v.toISOString() : null, val?.[1]],
                      col.type
                    )
                  }
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
                <DatePicker
                  label="To"
                  value={safeDayjs(val?.[1])}
                  onChange={(v) =>
                    setFieldValue(
                      col.field,
                      [val?.[0], v ? v.toISOString() : null],
                      col.type
                    )
                  }
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </Stack>
            </LocalizationProvider>
          </Paper>
        );
}
      case "singleSelect":
        const options = (col as GridSingleSelectColDef).valueOptions;
         const opts = typeof options === "function" ? options({} as GridValueOptionsParams) : options ?? [];

        return (
          <Paper
            key={col.field}
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
              }}
            >
              {col.headerName}
            </Typography>

            <TextField
              select
              size="small"
              fullWidth
              value={val ?? ""}
              onChange={(e) => setFieldValue(col.field, e.target.value, col.type)}
            >
              {opts.map((opt, i) => {
                const { value, label } = normalizeOption(opt);
                return (
                  <MenuItem key={i} value={value}>
                    {label}
                  </MenuItem>
                );
              })}
            </TextField>
          </Paper>
        );

      default:
        return (
          <Paper
            key={col.field}
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
              }}
            >
              {col.headerName}
            </Typography>

            <TextField
              size="small"
              fullWidth
              placeholder="Type to filter..."
              value={val ?? ""}
              onChange={(e) => setFieldValue(col.field, e.target.value, col.type)}
            />
          </Paper>
        );
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 1,
          mb: open ? 1 : 0,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <FilterAltOutlined color="primary" />
          <Typography variant="h6" >
            Filters
          </Typography>
        </Stack>
        <IconButton onClick={() => setOpen((prev) => !prev)} size="small">
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={open} unmountOnExit>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {validColumns.map((col) => (
            <Grid key={col.field} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              {renderFilterRow(col)}
            </Grid>
          ))}
        </Grid>
      </Collapse>
    </Paper>
  );
};

export default DynamicFiltersToolbar;
