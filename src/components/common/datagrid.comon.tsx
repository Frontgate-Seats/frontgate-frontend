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
  type GridEventListener,
} from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";

const INITIAL_PAGE_SIZE = 10;

// ✅ Reusable DataGrid Page (for both Events and Listings)
export default function DataGridPage({
  rows,
  rowCount,
  onRefresh,
  isLoading,
  error,
  paginationModel,
  setPaginationModel,
  columns,
}: {
  rows: any[];
  rowCount: number;
  onRefresh: () => void;
  isLoading: boolean;
  error: Error | null;
  paginationModel: GridPaginationModel;
  setPaginationModel: (m: GridPaginationModel) => void;
  columns: GridColDef[];
}) {
  const initialState = React.useMemo(
    () => ({
      pagination: { paginationModel: { pageSize: INITIAL_PAGE_SIZE } },
    }),
    []
  );

  const handleRowClick = React.useCallback<
    GridEventListener<"rowClick">
  >(() => {}, []);

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
          getRowId={(row) => row._id}
          rowCount={rowCount}
          columns={columns}
          pagination
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          loading={isLoading}
          initialState={initialState}
          pageSizeOptions={[5, INITIAL_PAGE_SIZE, 25]}
          autoHeight
        />
      )}
    </Box>
  );
}
