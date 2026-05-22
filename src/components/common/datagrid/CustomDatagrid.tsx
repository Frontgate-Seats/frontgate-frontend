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
  type GridRowHeightParams,
} from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import CustomFilterToolbar from "./CustomToolbar";
import CustomHeaderFilter from "./CustomHeaderFilter";
import type { CustomGridColDef } from "../../../shared/types/mui.type";
import ToggleFullscreen from "../ToggleFullscreen";

const INITIAL_PAGE_SIZE = 25;

type FilterType = "custom" | "header";

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
  onRowClick?: GridEventListener<"rowClick">;
  defaultFilterType?: FilterType;
  height?: number;
  headerComponent?: React.ReactNode;
  logo?: string;
  getRowHeight?: (params: GridRowHeightParams) => number | null | undefined;
  getRowClassName?: (params: any) => string;
  paginationMode?: "client" | "server";
  sortingMode?: "client" | "server";
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
  onRowClick,
  defaultFilterType = "custom",
  height = 840,
  headerComponent,
  logo,
  getRowHeight,
  getRowClassName,
  paginationMode = "server",
  sortingMode = "server",
}: CustomDataGridProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const handleFullscreenChange = (fullscreenMode: boolean) => {
    setIsFullscreen(fullscreenMode);
  };

  const [showFilters, setShowFilters] = React.useState(true);

  // Default header component with logo
  const defaultHeaderComponent = (
    <Stack direction="row" alignItems="center" spacing={1}>
      {logo && (
        <Tooltip
          title={
            logo.includes("tj-logo")
              ? "Ticket Jokey"
              : logo.includes("vivid-logo")
                ? "Vivid Seats"
                : logo.includes("seatgeek-logo")
                  ? "SeatGeek"
                  : ""
          }
        >
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{
              width: 24,
              height: 24,
              objectFit: "contain",
            }}
          />
        </Tooltip>
      )}
      <Box component="h2" sx={{ m: 0 }}>
        {title}
      </Box>
    </Stack>
  );

  const finalHeaderComponent = headerComponent || defaultHeaderComponent;

  const customColumns = React.useMemo(() => {
    return columns.map((col) => {
      if (
        defaultFilterType === "header" &&
        filterModel &&
        setFilterModel &&
        col.type != "actions" &&
        !!col.headerName &&
        showFilters
      ) {
        return {
          ...col,
          filterable: false,
          sortable: true, // Enable sorting for custom sort icons
          hideSortIcons: true,
          disableColumnMenu: true,
          renderHeader: () => (
            <CustomHeaderFilter
              column={col}
              filterModel={filterModel}
              setFilterModel={setFilterModel}
              sortingModel={sortingModel}
              setSortingModel={setSortingModel}
            />
          ),
        };
      }

      return {
        ...col,
        filterable: false,
      };
    });
  }, [
    columns,
    defaultFilterType,
    filterModel,
    setFilterModel,
    showFilters,
    sortingModel,
    setSortingModel,
  ]);

  return (
    <ToggleFullscreen onFullscreenChange={handleFullscreenChange}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          ...(isFullscreen ? { height: "100%" } : { height }),
        }}
      >
        {title || onRefresh ? (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 2, flexShrink: 0 }}
          >
            {finalHeaderComponent}

            <Stack direction="row" spacing={1}>
              {defaultFilterType === "header" &&
                filterModel &&
                setFilterModel && (
                  <Tooltip
                    title={showFilters ? "Hide filters" : "Show filters"}
                    placement="left"
                    enterDelay={1000}
                  >
                    <IconButton
                      size="medium"
                      aria-label="toggle filters"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      {showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
                    </IconButton>
                  </Tooltip>
                )}
              <Tooltip title="Reload data" placement="right" enterDelay={1000}>
                <IconButton
                  size="medium"
                  aria-label="refresh"
                  onClick={onRefresh}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
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
            {filterModel && setFilterModel && defaultFilterType === "custom" ? (
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
            <DataGrid
              rows={rows}
              getRowId={(row) => row._id || row.id}
              rowCount={rowCount}
              columns={customColumns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: INITIAL_PAGE_SIZE },
                },
                density: "compact",
              }}
              pagination
              paginationMode={paginationMode}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sortingMode={sortingMode}
              sortModel={sortingModel}
              onSortModelChange={setSortingModel}
              disableRowSelectionOnClick
              onRowClick={onRowClick}
              loading={isLoading}
              pageSizeOptions={[5, 10, INITIAL_PAGE_SIZE, 50, 100]}
              {...(getRowHeight ? { getRowHeight } : {})}
              getRowClassName={
                getRowClassName ??
                ((params) =>
                  params.row._rowType === "detail" ? "trade-detail-row" : "")
              }
              sx={{
                "& .MuiDataGrid-cell": {
                  whiteSpace: "nowrap !important",
                  overflow: "hidden !important",
                  textOverflow: "ellipsis !important",
                  lineHeight: "1.4rem",
                  display: "block !important",
                  padding: "8px 16px",
                  minWidth: 0,
                },
                "& .MuiDataGrid-cellContent": {
                  whiteSpace: "nowrap !important",
                  overflow: "hidden !important",
                  textOverflow: "ellipsis !important",
                  width: "100%",
                },
                // Detail rows: the spanning cell needs overflow visible and no padding
                // so the full-width panel renders flush. Target only the __expand cell.
                "& .trade-detail-row .MuiDataGrid-cell[data-field='__expand']": {
                  overflow: "visible !important",
                  whiteSpace: "normal !important",
                  padding: "0 !important",
                  display: "flex !important",
                  alignItems: "flex-start !important",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  whiteSpace: "normal !important",
                  lineHeight: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                },
                // Hide sort icons and menu icons globally
                ...(defaultFilterType === "header" &&
                  showFilters && {
                    "& .MuiDataGrid-columnHeader": {
                      padding: 0,
                      minHeight: 100,
                      height: 100,
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      minHeight: 100,
                    },
                  }),
              }}
            />
          </>
        )}
      </Box>
    </ToggleFullscreen>
  );
}
