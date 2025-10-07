import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  type GridColDef,
  type GridFilterModel,
  type GridPaginationModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import {
  Typography,
  Chip,
  Grid,
  Alert,
} from "@mui/material";
import type { AppDispatch, RootState } from "../store";
import { getPurchases } from "../store/slices/purchases.slice";
import DataGridPage from "../components/common/datagrid.comon";

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

  const columns: GridColDef[] = [
    { field: "eventId", headerName: "Event ID", flex: 1, minWidth: 150 },
    { field: "listingId", headerName: "Listing ID", flex: 1, minWidth: 150 },
    { field: "quantity", headerName: "Quantity", flex: 0.5, minWidth: 100 },
    { field: "unitAmount", headerName: "Price Per", flex: 0.5, minWidth: 120 },
    {
      field: "totalAmount",
      headerName: "Total Amount",
      flex: 0.5,
      minWidth: 120,
      renderCell: (params) => (
        <Typography fontWeight={600}>
          ${params.value?.toFixed?.(2) || 0}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.6,
      minWidth: 130,
      renderCell: (params) => {
        const status = params.value?.toUpperCase?.() || "PENDING";
        let color: "default" | "error" | "success" | "warning" | "info" =
          "default";

        switch (status) {
          case "COMPLETED":
            color = "success";
            break;
          case "CANCELLED":
          case "FAILED":
            color = "error";
            break;
          case "PENDING":
            color = "warning";
            break;
          default:
            color = "info";
        }

        return (
          <Chip
            label={status}
            color={color}
            size="small"
            sx={{
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          />
        );
      },
    },
  ];

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Grid size={{ xs: 12 }}>
          {purchasesError ? (
            <Alert severity="error">{purchasesError}</Alert>
          ) : (
            <DataGridPage
              title="Events"
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
              showToolbar
              paginationMode="server"
              sortingMode="server"
              filterMode="server"
              onRefresh={handleRefresh}
            />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default PurchasesPage;
