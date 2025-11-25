import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import {
  DataGrid,
  type GridPaginationModel,
  type GridSortModel,
  type GridFilterModel,
  type GridEventListener,
} from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import CustomFilterToolbar from "./CustomToolbar";
import type { CustomGridColDef } from "../../../shared/types/mui.type";

const INITIAL_PAGE_SIZE = 25;

interface CustomDataGridProps {
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
  setFilterModel?: React.Dispatch<React.SetStateAction<GridFilterModel>>;
  columns: CustomGridColDef[];
  autoHeight?: boolean;
  onRowClick?: GridEventListener<"rowClick">;
}

export default function CustomDataGrid({
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
  autoHeight = false,
  onRowClick,
}: CustomDataGridProps) {
  
  const initialState = React.useMemo(
    () => ({
      pagination: { paginationModel: { pageSize: INITIAL_PAGE_SIZE } },
    }),
    []
  );

  const customColumns = React.useMemo(() => {
    return columns.map((col) => {
      return {  
        ...col,
        filterable:  false,
      };
    });
  }, [columns]);


  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100%", 
      width: "100%",
      minHeight: 0
    }}>
      {title || onRefresh ? (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 2, flexShrink: 0 }}
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
      ) : (
        <></>
      )}
      {error ? (
        <Box sx={{ flexGrow: 1 }}>
          <Alert severity="error">{error.message}</Alert>
        </Box>
      ) : (
        <>
          {filterModel && setFilterModel ? (
            <Box sx={{ flexShrink: 0 }}>
              <CustomFilterToolbar
                columns={columns}
                filterModel={filterModel}
                setFilterModel={setFilterModel}
              />
            </Box>
          ) : (
            <></>
          )}
          <Box sx={{ height: 800, width: "100%" }}>
            {/* Wrapper for scroll */}
            <DataGrid
              rows={rows}
              getRowId={(row) => row._id || row.id}
              rowCount={rowCount}
              columns={customColumns}
              initialState={initialState}
              pagination
              paginationMode={"server"}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sortingMode={"server"}
              sortModel={sortingModel}
              onSortModelChange={setSortingModel}
              disableRowSelectionOnClick
              onRowClick={onRowClick}
              loading={isLoading}
              pageSizeOptions={[5, 10, INITIAL_PAGE_SIZE, 50, 100]}
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
        </>
      )}
    </Box>
  );
}
