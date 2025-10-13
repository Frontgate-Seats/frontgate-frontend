import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import {
  DataGridPro,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
  type GridFilterModel,
  type GridEventListener,
} from "@mui/x-data-grid-pro";
import RefreshIcon from "@mui/icons-material/Refresh";

const INITIAL_PAGE_SIZE = 10;

interface DataGridPageProps {
  title: string;
  rows: any[];
  rowCount: number;
  onRefresh: () => void;
  isLoading: boolean;
  error: Error | null;
  paginationModel?: GridPaginationModel;
  setPaginationModel?: (model: GridPaginationModel) => void;
  sortingModel?: GridSortModel;
  setSortingModel?: (model: GridSortModel) => void;
  filterModel?: GridFilterModel;
  setFilterModel?: (model: GridFilterModel) => void;
  columns: GridColDef[];
  showToolbar?: boolean;
  autoHeight?: boolean;
  paginationMode?: "server" | "client";
  sortingMode?: "server" | "client";
  filterMode?: "server" | "client";
  onRowClick?: GridEventListener<"rowClick">;
}

export default function DataGridPage({
  title,
  rows,
  rowCount,
  onRefresh,
  isLoading,
  error,
  paginationModel,
  setPaginationModel,
  sortingModel,
  setSortingModel,
  filterModel,
  setFilterModel,
  columns,
  showToolbar = false,
  autoHeight = false,
  paginationMode = "client",
  sortingMode = "client",
  filterMode = "client",
  onRowClick,
}: DataGridPageProps) {
  
  const initialState = React.useMemo(
    () => ({
      pagination: { paginationModel: { pageSize: INITIAL_PAGE_SIZE } },
    }),
    []
  );

  return (
    <Box sx={{ flex: 1, width: "100%", p: 2, overflowX: "auto" }}>
      {" "}
      {/* Set desired height */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Box component="h2" sx={{ m: 0 }}>
          {title}
        </Box>

        <Tooltip title="Reload data" placement="right" enterDelay={1000}>
          <IconButton size="small" aria-label="refresh" onClick={onRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      {error ? (
        <Box sx={{ flexGrow: 1 }}>
          <Alert severity="error">{error.message}</Alert>
        </Box>
      ) : (
        <Box sx={{ height: 600, width: "100%" }}>
          {/* Wrapper for scroll */}
          <DataGridPro
            rows={rows}
            getRowId={(row) => row._id || row.id}
            rowCount={rowCount}
            columns={columns}
            initialState={initialState}
            pagination
            paginationMode={paginationMode}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortingMode={sortingMode}
            sortModel={sortingModel}
            onSortModelChange={setSortingModel}
            filterMode={filterMode}
            filterModel={filterModel}
            onFilterModelChange={setFilterModel}
            disableRowSelectionOnClick
            onRowClick={onRowClick}
            loading={isLoading}
            showToolbar={showToolbar}
            pageSizeOptions={[5, INITIAL_PAGE_SIZE, 25, 50, 100]}
            autoHeight={autoHeight}
            sx={{
              "& .MuiDataGrid-cell": {
                whiteSpace: "normal !important",
                wordWrap: "break-word !important",
                lineHeight: "1.4rem",
                display: "flex",
                alignItems: "center",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                whiteSpace: "normal !important",
                lineHeight: "1.2rem",
                display: "flex",
                alignItems: "center",
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
