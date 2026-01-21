import * as React from "react";
import {
  Alert,
  Grid,
  Stack,
} from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { getSales } from "../store/slices/sales.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { useParams } from "react-router-dom";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { formatDateTime } from "../shared/utils/dateTime.util";
import { useClientFilters } from "../hooks/useClientFilters";

export default function SalesPage() {
  const dispatch = useAppDispatch();
  const { eventId } = useParams();

  const {
    rows: { data: sales },
    loading: salesLoading,
    error: salesError,
  } = useSelector((state: RootState) => state.sales);


  // Fetch sales data once
  React.useEffect(() => {
    if (eventId) dispatch(getSales(eventId));
  }, [dispatch, eventId]);

  const handleRefresh = () => {
    if (eventId) dispatch(getSales(eventId));
  };

  const allColumns: CustomGridColDef[] = [
    {
      field: "section_name",
      headerName: "Section",
      type: "string",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "row_name",
      headerName: "Row",
      type: "string",
      width: 80,
      flex: 0,
    },
    {
      field: "quantity",
      headerName: "Quantity",
      type: "number",
      width: 80,
      flex: 1,
      min: 0,
      max: 10000,
    },
    {
      field: "base_price",
      headerName: "Price",
      type: "number",
      width: 100,
      flex: 1,
      min: 0,
      max: 10000,
      valueFormatter: (value) => (value ? `$${value}` : "-"),
    },
    {
      field: "purchased_at",
      headerName: "Sale Date & Time",
      type: "dateTime",
      flex: 0,
      minWidth: 160,
      valueFormatter: (value) => formatDateTime(value),
    },
  ];

  // Use client-side filtering, pagination, and sorting
  const {
    paginationModel,
    sortModel,
    filterModel,
    setPaginationModel,
    setSortModel,
    setFilterModel,
    paginatedRows,
    totalFilteredRows,
  } = useClientFilters({
    data: sales || [],
    columns: allColumns,
    initialPaginationModel: { page: 0, pageSize: 25 },
    initialSortModel: [{ field: "purchaseUtc", sort: "desc" }],
    initialFilterModel: {
      items: [],
    },
  });

  return (
    <Stack
      padding={3}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Grid container spacing={3}>
        {salesError ? (
          <Alert severity="error">{salesError}</Alert>
        ) : (
          <>
            <Grid size={{ xs: 12 }}>
              <CustomDataGrid
                title="Seat Geek Sales"
                rows={paginatedRows}
                rowCount={totalFilteredRows}
                isLoading={salesLoading}
                error={salesError}
                columns={allColumns}
                paginationModel={paginationModel}
                setPaginationModel={setPaginationModel}
                sortingModel={sortModel}
                setSortingModel={setSortModel}
                filterModel={filterModel}
                setFilterModel={setFilterModel}
                onRefresh={handleRefresh}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Stack>
  );
}
