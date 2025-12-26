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
} from "@mui/material";
import { ExpandLess, ExpandMore, FilterAltOutlined } from "@mui/icons-material";
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
    <Paper
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
        {column.headerName}
      </Typography>

      <FilterInput
        column={column}
        value={localValue}
        onChange={handleChange}
        onCommit={commitNow}
        size="small"
        variant="outlined"
        fullWidth
        placeholder="Type to filter..."
        showAllOption={false}
      />
    </Paper>
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
