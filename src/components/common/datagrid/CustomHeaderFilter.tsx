import React from "react";
import { Box, IconButton, Stack } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import type {
  GridFilterModel,
  GridSortModel,
} from "@mui/x-data-grid";
import type { CustomGridColDef } from "../../../shared/types/mui.type";
import { useFilterLogic } from "./hooks/useFilterLogic";
import FilterInput from "./components/FilterInput";

interface CustomHeaderFilterProps {
  column: CustomGridColDef;
  filterModel: GridFilterModel;
  setFilterModel: React.Dispatch<React.SetStateAction<GridFilterModel>>;
  sortingModel?: GridSortModel;
  setSortingModel?: (model: GridSortModel) => void;
}

export default function CustomHeaderFilter({
  column,
  filterModel,
  setFilterModel,
  sortingModel,
  setSortingModel,
}: CustomHeaderFilterProps) {
  const { localValue, handleChange } = useFilterLogic({
    field: column.field,
    columnType: column.type,
    filterModel,
    setFilterModel,
    debounceMs: 300,
  });

  // Get current sort direction
  const currentSort = sortingModel?.find((sort) => sort.field === column.field);
  const sortDirection = currentSort?.sort || null;

  const handleSort = () => {
    if (!setSortingModel) return;
    
    let newSort: GridSortModel = [];
    
    if (sortDirection === null) {
      // No sort -> ascending
      newSort = [{ field: column.field, sort: "asc" }];
    } else if (sortDirection === "asc") {
      // Ascending -> descending
      newSort = [{ field: column.field, sort: "desc" }];
    } else {
      // Descending -> no sort
      newSort = [];
    }
    
    setSortingModel(newSort);
  };

  const getSortIcon = () => {
    if (sortDirection === "asc") return <ArrowUpwardIcon fontSize="small" />;
    if (sortDirection === "desc") return <ArrowDownwardIcon fontSize="small" />;
    return <UnfoldMoreIcon fontSize="small" />;
  };

  const handleFilterClick = (event: React.MouseEvent) => {
    // Prevent the click from bubbling up to trigger sorting
    event.stopPropagation();
  };

  return (
    <Box sx={{ p: 0.25, height: "100%", display: "flex", flexDirection: "column", gap: 0.25 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ flexShrink: 0, minHeight: 20 }}>
        <Box sx={{ fontWeight: 600, fontSize: "0.75rem", lineHeight: 1.1 }}>
          {column.headerName}
        </Box>
        {setSortingModel && (
          <IconButton size="small" onClick={handleSort} sx={{ p: 0.2, ml: 0.25 }}>
            {getSortIcon()}
          </IconButton>
        )}
      </Stack>
      <Box onClick={handleFilterClick}>
        <FilterInput
          column={column}
          value={localValue}
          onChange={handleChange}
          size="small"
          variant="outlined"
          fullWidth
          placeholder="Filter..."
          compact={true}
        />
      </Box>
    </Box>
  );
}