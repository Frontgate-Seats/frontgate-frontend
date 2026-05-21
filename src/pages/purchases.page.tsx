import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Typography, Grid, Alert, Link, Stack } from "@mui/material";
import type { AppDispatch, RootState } from "../store";
import { getPurchases } from "../store/slices/purchases.slice";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { useDataGridQueryParams } from "../hooks/useDataGridQueryParams";
import { formatDateTime } from "../shared/utils/dateTime.util";

const PurchasesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    loading: purchasesLoading,
    rows: { data: purchases, total },
    error: purchasesError,
  } = useSelector((state: RootState) => state.purchases);

  const { paginationModel, setPaginationModel, sortModel, setSortModel, filterModel, setFilterModel } =
    useDataGridQueryParams({
      columns: [
        { field: "event_id", type: "string" },
        { field: "event_name", type: "string" },
        { field: "event_utc_date", type: "dateTime" },
        { field: "created_at", type: "dateTime" },
        { field: "listing_id", type: "string" },
        { field: "purchase_id", type: "string" },
        { field: "inventory_id", type: "string" },
        { field: "section", type: "string" },
        { field: "row", type: "string" },
        { field: "quantity", type: "number" },
        { field: "total_amount", type: "number" },
        { field: "status", type: "string" },
        { field: "purchase_status", type: "string" },
        { field: "inventory_status", type: "string" },
      ],
      defaultPaginationModel: { page: 0, pageSize: 25 },
      defaultSortModel: [],
      defaultFilterModel: { items: [] },
    });

  React.useEffect(() => {
    dispatch(
      getPurchases({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      }),
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handleRefresh = React.useCallback(() => {
    dispatch(
      getPurchases({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      }),
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

const columns: CustomGridColDef[] = [
  {
    field: "event_id",
    headerName: "Event ID",
    width: 140,
    type: "string",
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
    field: "event_name",
    headerName: "Event",
    flex: 1.5,
    minWidth: 260,
    type: "string",
  },
  {
    field: "event_utc_date",
    headerName: "Event Date",
    width: 180,
    type: "dateTime",
    valueGetter: (value: any) => (value ? new Date(value) : null),
    valueFormatter: (value) => (value ? formatDateTime(value) : "-"),
  },
  {
    field: "created_at",
    headerName: "Purchase Date",
    width: 180,
    type: "dateTime",
    valueGetter: (value: any) => (value ? new Date(value) : null),
    valueFormatter: (value) => (value ? formatDateTime(value) : "-"),
  },
  {
    field: "listing_id",
    headerName: "Listing ID",
    type: "string",
    width: 140,
  },
  {
    field: "purchase_id",
    headerName: "PO ID",
    type: "string",
    width: 140,
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
    field: "inventory_id",
    headerName: "Inventory ID",
    type: "string",
    width: 140,
  },
  {
    field: "section",
    headerName: "Section",
    type: "string",
    width: 140,
  },
  {
    field: "row",
    headerName: "Row",
    type: "string",
    width: 90,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "quantity",
    headerName: "Qty",
    width: 80,
    align: "center",
    headerAlign: "center",
    type: "number",
    min: 0,
    max: 1000,
  },
  {
    field: "total_amount",
    headerName: "Total",
    width: 110,
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
    width: 140,
    type: "string",
  },
  {
    field: "purchase_status",
    headerName: "PO Status",
    headerAlign: "center",
    align: "center",
    width: 140,
    type: "string",
  },
  {
    field: "inventory_status",
    headerName: "Inventory Status",
    headerAlign: "center",
    align: "center",
    width: 160,
    type: "string",
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
      <Grid
        size={{ xs: 12 }}
        sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <Grid
          size={{ xs: 12 }}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
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
