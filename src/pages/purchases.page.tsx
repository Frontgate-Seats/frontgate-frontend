import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  type GridFilterModel,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { Typography, Grid, Alert, Link, Stack } from "@mui/material";
import type { AppDispatch, RootState } from "../store";
import { getPurchases } from "../store/slices/purchases.slice";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";

const PurchasesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    loading: purchasesLoading,
    rows: { data: purchases, total },
    error: purchasesError,
  } = useSelector((state: RootState) => state.purchases);

  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [],
  });

  React.useEffect(() => {
    dispatch(
      getPurchases({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      })
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handleRefresh = React.useCallback(() => {
    dispatch(
      getPurchases({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      })
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const columns: CustomGridColDef[] = [
    {
      field: "eventId",
      headerName: "Event ID",
      type: "string",
      flex: 1,
      renderCell: (params) => (
        <Link
          href={`https://www.vividseats.com/curling-canada-tickets-scotiabank-centre-11-25-2025--sports-other-sports/production/${params.value}`}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="primary"
        >
          {params.value}
        </Link>
      ),
    },
     {
      field: "listingId",
      headerName: "Listing ID",
      type: "string",
      flex: 1,
    },
    {
      field: "purchaseId",
      headerName: "PO ID",
      type: "string",
      flex: 1,
      renderCell: (params) => (
        <Link
          href={`https://skybox.vividseats.com/purchases/${params.value}`}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="primary"
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: "inventoryId",
      headerName: "Inventory ID",
      type: "string",
      flex: 1,
    },
    {
      field: "sectionName",
      headerName: "Section",
      type: "string",
      flex: 1,
    },
    {
      field: "row",
      headerName: "Row",
      type: "string",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "quantity",
      headerName: "Qty",
      flex: 1,
      align: "center",
      headerAlign: "center",
      type: "number",
      min: 0,
      max: 1000
    },
   
    {
      field: "totalAmount",
      headerName: "Total",
      flex: 1,
      type: "number",
      min: 0,
      max: 10000,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Typography fontWeight={600} color="text.primary">
          ${params.value?.toFixed?.(2) || 0}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      headerAlign: "center",
      align: "center",
      flex: 1,
      type: "string",
    },
    {
      field: "purchaseStatus",
      headerName: "PO Status",
      headerAlign: "center",
      align: "center",
      flex: 1,
      type: "string",
    },
    {
      field: "inventoryStatus",
      headerName: "Inventory Status",
      headerAlign: "center",
      align: "center",
      flex: 1,
      type: "string",
    },
  ];


  return (
    <Stack padding={3} sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Grid size={{ xs: 12 }} sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Grid size={{ xs: 12 }} sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {purchasesError ? (
            <Alert severity="error">{purchasesError}</Alert>
          ) : (
            <CustomDataGrid
              title="Purchases"
              rows={purchases}
              rowCount={total}
              columns={columns}
              isLoading={purchasesLoading}
              error={purchasesError as any}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              sortingModel={sortModel}
              setSortingModel={setSortModel}
              filterModel={filterModel}
              setFilterModel={setFilterModel}
              onRefresh={handleRefresh}
            />
          )}
        </Grid>
      </Grid>
    </Stack>
  );
};

export default PurchasesPage;
