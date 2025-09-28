import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
  type GridFilterModel,
  type GridEventListener,
  GridToolbar,
} from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";

const INITIAL_PAGE_SIZE = 10;

interface DataGridPageProps {
  rows: any[];
  rowCount: number;
  onRefresh: () => void;
  isLoading: boolean;
  error: Error | null;
  paginationModel: GridPaginationModel;
  setPaginationModel: (model: GridPaginationModel) => void;
  sortingModel?: GridSortModel;
  setSortingModel?: (model: GridSortModel) => void;
  filterModel?: GridFilterModel;
  setFilterModel?: (model: GridFilterModel) => void;
  columns: GridColDef[];
  showToolbar?: boolean;
  autoHeight?: boolean;
}

export default function DataGridPage({
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
  autoHeight =false
}: DataGridPageProps) {
  const initialState = React.useMemo(
    () => ({
      pagination: { paginationModel: { pageSize: INITIAL_PAGE_SIZE } },
    }),
    []
  );

  const handleRowClick = React.useCallback<GridEventListener<"rowClick">>(() => {}, []);

  return (
    <Box sx={{ flex: 1, width: "100%", p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Tooltip title="Reload data" placement="right" enterDelay={1000}>
          <div>
            <IconButton size="small" aria-label="refresh" onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </div>
        </Tooltip>
      </Stack>

      {error ? (
        <Box sx={{ flexGrow: 1 }}>
          <Alert severity="error">{error.message}</Alert>
        </Box>
      ) : (
        <DataGrid
          rows={rows}
          getRowId={(row) => row._id || row.eventId}
          rowCount={rowCount}
          columns={columns}
          pagination
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortingMode="server"
          sortModel={sortingModel}
          onSortModelChange={setSortingModel}
          filterMode="server"
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          loading={isLoading}
          initialState={initialState}
          pageSizeOptions={[5, INITIAL_PAGE_SIZE, 25]}
          showToolbar={showToolbar}
          autoHeight={autoHeight}
        />
      )}
    </Box>
  );
}
