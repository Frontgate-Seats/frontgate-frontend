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
import type { GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { GridFilterModel } from "@mui/x-data-grid";
import dayjs from "dayjs";
import type { CustomGridColDef } from "../shared/types/mui.type";

export default function SalesPage() {
  const dispatch = useAppDispatch();
  const { eventId } = useParams();

  const {
    rows: { data: salesData },
    loading: salesLoading,
    error: salesError,
  } = useSelector((state: RootState) => state.sales);

  const flattenedRows = React.useMemo(() => {
    const result: any[] = [];
    salesData.forEach((sale) => {
      (sale.data || []).forEach((s: any) => {
        result.push({
          id: s.id,
          saleId: s.id,
          listingDBId: sale._id,
          eventId: sale.eventId,
          eventDBId: sale.eventDBId,
          eventName: sale.name,
          venueId: sale.venueId,
          performerIds: sale.performerIds,
          providerDBId: sale.providerDBId,
          row: s.row,
          section: s.section,
          quantity: s.quantity,
          price: s.broadcastPrice,
          stockType: s.stockType,
        });
      });
    });
    return result;
  }, [salesData]);

  React.useEffect(() => {
    dispatch(
      getSales({
        filters: {
          items: [
            ...(eventId
              ? [
                  {
                    id: "default",
                    field: "eventId",
                    operator: "equals",
                    value: eventId,
                  },
                ]
              : []),
          ],
        },
      })
    );
  }, [dispatch, eventId]);

  const handleRefresh = () => {
    dispatch(
      getSales({
        filters: {
          items: [
            ...(eventId
              ? [
                  {
                    id: "default",
                    field: "eventId",
                    operator: "equals",
                    value: eventId,
                  },
                ]
              : []),
          ],
        },
      })
    );
  };

  const allColumns: CustomGridColDef[] = [
    { field: "eventId", headerName: "eventId", flex: 1, type: "string" },
    { field: "section", headerName: "Section", flex: 1, type: "string" },
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
      field: "price",
      headerName: "Price",
      type: "number",
      flex: 0.7,
      min: 0,
      max: 10000,
      valueFormatter: (value) => (value ? `$${value}` : "-"),
    },
    {
      field: "stockType",
      headerName: "Stock Type",
      flex: 1,
      type: "string",
      align: "center",
      headerAlign: "center",
    },
  ];

  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({ page: 0, pageSize: 25 });

  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [],
  });

  const filteredRows = React.useMemo(() => {
    if (!filterModel?.items?.length) return flattenedRows;

    return flattenedRows.filter((row) =>
      filterModel.items.every(({ field, operator, value }) => {
        if (value == null || value === "") return true;

        const col = allColumns.find((c) => c.field === field);
        const colType = col?.type || "string";
        const fieldValue = row[field];

        switch (colType) {
          // -------------------- TEXT --------------------
          default: {
            if (operator === "contains") {
              return String(fieldValue ?? "")
                .toLowerCase()
                .includes(String(value).toLowerCase());
            }
            if (operator === "equals") {
              return (
                String(fieldValue ?? "").toLowerCase() ===
                String(value).toLowerCase()
              );
            }
            return true;
          }

          // -------------------- NUMBER --------------------
          case "number": {
            const fv = Number(fieldValue);
            const val = Number(value);
            if (isNaN(fv) || isNaN(val)) return false;

            if (operator === ">=") return fv >= val;
            if (operator === "<=") return fv <= val;
            if (operator === "equals") return fv === val;
            return true;
          }

          // -------------------- DATE --------------------
          case "date":
          case "dateTime": {
            const fv = dayjs(fieldValue);
            const val = dayjs(value);
            if (!fv.isValid() || !val.isValid()) return false;

            if (operator === "onOrAfter")
              return fv.isSame(val, "day") || fv.isAfter(val, "day");
            if (operator === "onOrBefore")
              return fv.isSame(val, "day") || fv.isBefore(val, "day");
            return true;
          }

          // -------------------- SINGLE SELECT --------------------
          case "singleSelect": {
            return String(fieldValue ?? "") === String(value);
          }
        }
      })
    );
  }, [flattenedRows, filterModel, allColumns]);

  const sortedRows = React.useMemo(() => {
    if (!sortModel?.length) return filteredRows;

    const { field, sort } = sortModel[0];
    return [...filteredRows].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (aValue < bValue) return sort === "asc" ? -1 : 1;
      if (aValue > bValue) return sort === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortModel]);

  const paginatedRows = React.useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    return sortedRows.slice(start, end);
  }, [sortedRows, paginationModel]);

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
                title="Seatgeek Sales"
                rows={paginatedRows}
                rowCount={flattenedRows.length}
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
