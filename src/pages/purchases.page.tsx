import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  type GridFilterModel,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { Typography, Chip, Grid, Alert, Container } from "@mui/material";
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
    React.useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    //   { field: "utcDate", sort: "asc" },
  ]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [
      // { field: "category", operator: "equals", value: "Sports" },
      // {
      //   field: "utcDate",
      //   operator: "onOrAfter",
      //   value: moment().utc().toISOString(),
      // },
    ],
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
    minWidth: 160,
  },
  {
    field: "listingId",
    headerName: "Listing ID",
    type: "string",
    flex: 1,
    minWidth: 160,
  },
  {
    field: "row",
    headerName: "Row",
    type: "string",
    flex: 0.5,
    minWidth: 100,
  },
  {
    field: "sectionName",
    headerName: "Section",
    type: "string",
    flex: 0.7,
    minWidth: 120,
  },
  {
    field: "quantity",
    headerName: "Qty",
    flex: 0.4,
    minWidth: 90,
    align: "center",
    headerAlign: "center",
    type: "number",
    min: 0,
    max: 1000
  },
  {
    field: "pricePer",
    headerName: "Price/Unit",
    flex: 0.6,
    minWidth: 120,
    type: "number",
    min: 0,
    max: 10000,
    renderCell: (params) => (
      <Typography fontWeight={500}>${params.value?.toFixed?.(2) || 0}</Typography>
    ),
  },
  {
    field: "totalAmount",
    headerName: "Total ($)",
    flex: 0.7,
    minWidth: 130,
    type: "number",
    min: 0,
    max: 10000,
    renderCell: (params) => (
      <Typography fontWeight={600} color="text.primary">
        ${params.value?.toFixed?.(2) || 0}
      </Typography>
    ),
  },
  {
    field: "status",
    headerName: "Status",
    flex: 0.6,
    type: "string",
    minWidth: 130
  },
];


  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Grid size={{ xs: 12 }}>
        <Grid size={{ xs: 12 }}>
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
    </Container>
  );
};

export default PurchasesPage;
