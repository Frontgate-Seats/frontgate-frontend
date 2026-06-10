// src/components/datagrid/DynamicFiltersToolbar.tsx
import React, { useState } from "react";
import {
  Grid,
  Stack,
  Typography,
  Paper,
  Divider,
  IconButton,
  Collapse,
  Box,
  Chip,
  Tooltip,
} from "@mui/material";
import { ExpandLess, ExpandMore, FilterList, Clear } from "@mui/icons-material";
import type { GridFilterModel } from "@mui/x-data-grid";
import type { CustomGridColDef } from "../../../shared/types/mui.type";
import { useFilterLogic } from "./hooks/useFilterLogic";
import FilterInput from "./components/FilterInput";

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
// Filter Row Component
// =======================
interface FilterRowProps {
  column: CustomGridColDef;
  filterModel: GridFilterModel;
  setFilterModel: React.Dispatch<React.SetStateAction<GridFilterModel>>;
  debounceMs: number;
}

const FilterRow: React.FC<FilterRowProps> = ({
  column,
  filterModel,
  setFilterModel,
  debounceMs,
}) => {
  const { localValue, handleChange, commitNow } = useFilterLogic({
    field: column.field,
    columnType: column.type,
    filterModel,
    setFilterModel,
    debounceMs,
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography 
        variant="body2" 
        fontWeight={600} 
        color="text.secondary" 
        sx={{ mb: 1, minHeight: 20 }}
      >
        {column.headerName}
      </Typography>
      <Box sx={{ flex: 1, display: "flex", alignItems: "flex-start" }}>
        <FilterInput
          column={column}
          value={localValue}
          onChange={handleChange}
          onCommit={commitNow}
          size="small"
          variant="outlined"
          fullWidth
          placeholder="Type to filter..."
          compact={false}
        />
      </Box>
    </Box>
  );
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
  const [open, setOpen] = useState(false);

  const validColumns = columns.filter(
    (col) =>
      col.filterable !== false &&
      col.field &&
      col.headerName?.trim() &&
      col.type !== "actions"
  );

  // Count active filters
  const activeFilterCount = filterModel?.items?.filter((item) => {
    if (Array.isArray(item.value)) {
      return item.value.some((v) => v != null && v !== "");
    }
    return item.value != null && item.value !== "";
  }).length || 0;

  // Clear all filters
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFilterModel({ items: [] });
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
          cursor: "pointer",
          mb: open ? 2 : 0,
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <FilterList color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              color="primary"
            />
          )}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {activeFilterCount > 0 && (
            <Tooltip title="Clear all filters">
              <IconButton size="small" onClick={handleClearAll}>
                <Clear />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small">
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Stack>
      </Box>

      <Collapse in={open} unmountOnExit>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {validColumns.map((col) => (
            <Grid key={col.field} size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
              <FilterRow
                column={col}
                filterModel={filterModel}
                setFilterModel={setFilterModel}
                debounceMs={debounceMs}
              />
            </Grid>
          ))}
        </Grid>
      </Collapse>
    </Paper>
  );
};

export default DynamicFiltersToolbar;
