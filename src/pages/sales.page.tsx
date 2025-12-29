import * as React from "react";
import { Alert, Grid, Stack } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { getSales } from "../store/slices/sales.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import type { GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { GridFilterModel } from "@mui/x-data-grid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { formatDateTime } from "../shared/utils/dateTime.util";
import { Link } from "@mui/material";

export default function SalesPage() {
  const dispatch = useAppDispatch();

  const {
    rows: { data: sales, total: totalSales },
    loading: salesLoading,
    error: salesError,
  } = useSelector((state: RootState) => state.sales);

  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: "localDate", sort: "asc" },
  ]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [],
  });

  React.useEffect(() => {
    dispatch(
      getSales({
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      })
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handleRefresh = () => {
    dispatch(
      getSales({
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      })
    );
  };

  const allColumns: CustomGridColDef[] = [
    {
      field: "eventId",
      headerName: "Event ID",
      flex: 1,
      type: "string",
      renderCell: (params) => (
        <Link
          href={`https://seatgeek.com/philadelphia-eagles-tickets/1-4-2026-philadelphia-pennsylvania-lincoln-financial-field/nfl/${params.value}`}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="primary"
        >
          {params.value}
        </Link>
      ),
    },
    { field: "eventName", headerName: "Event Name", flex: 1.5, type: "string" },
    {
      field: "EventLocalDate",
      headerName: "Event Date & Time",
      flex: 1,
      type: "dateTime",
      valueFormatter: (value) => formatDateTime(value),
    },
    { field: "section", headerName: "Section", flex: 0.8, type: "string" },
    { field: "row", headerName: "Row", flex: 0.5, type: "string" },
    {
      field: "quantity",
      headerName: "Qty",
      flex: 0.4,
      type: "number",
      min: 0,
      max: 10000,
    },
    {
      field: "broadcastPrice",
      headerName: "Price",
      type: "number",
      flex: 0.7,
      min: 0,
      max: 10000,
      valueFormatter: (value) => (value ? `$${value}` : "-"),
    },
    {
      field: "purchaseUtc",
      headerName: "Purchase Date",
      flex: 1,
      type: "dateTime",
      valueFormatter: (value) => formatDateTime(value),
    },
  ];

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
                rows={sales}
                rowCount={totalSales}
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
