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
  height = 800,
  headerComponent = (
    <Box component="h2" sx={{ m: 0 }}>
      {title}
    </Box>
  ),
}: CustomDataGridProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);

  // Handle window resize for fullscreen mode
  React.useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    if (isFullscreen) {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isFullscreen]);

  const handleFullscreenChange = (fullscreenMode: boolean) => {
    setIsFullscreen(fullscreenMode);
  };

  // Adjust height based on fullscreen mode
  // In fullscreen, calculate available height minus header and controls
  const calculateDataGridHeight = () => {
    if (isFullscreen) {
      // In fullscreen: viewport height minus card padding, header, controls, and top padding
      const headerHeight = 80; // Title and controls
      const cardPadding = 48; // CardContent padding
      const topPadding = 48; // Top padding from ToggleFullscreen
      return Math.max(
        400,
        windowHeight - headerHeight - cardPadding - topPadding
      );
    }
    return height;
  };

  const calculatedHeight = calculateDataGridHeight();

  const [showFilters, setShowFilters] = React.useState(true);

  const initialState = React.useMemo(
    () => ({
      pagination: { paginationModel: { pageSize: INITIAL_PAGE_SIZE } },
    }),
    []
  );

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
        filterable: false, // Disable for custom filtering
        sortable: true, // Enable sorting but hide default icons
        hideSortIcons: true,
        disableColumnMenu: true, // Hide three dots menu
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
          height: "100%",
          width: "100%",
          minHeight: 0,
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
            {headerComponent}

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
                      size="small"
                      aria-label="toggle filters"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      {showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
                    </IconButton>
                  </Tooltip>
                )}
              <Tooltip title="Reload data" placement="right" enterDelay={1000}>
                <IconButton
                  size="small"
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
            <Box
              sx={{
                width: "100%",
                ...(isFullscreen ? { height: calculatedHeight } : { height }),
              }}
            >
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
            </Box>
          </>
        )}
      </Box>
    </ToggleFullscreen>
  );
}
