import * as React from "react";
import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import DataGridPage from "../components/common/datagrid.comon";
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from "@mui/x-data-grid";
import type { RootState } from "../store";
import { getListings } from "../store/slices/listings.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { useNavigate, useParams } from "react-router-dom";

export default function ListingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { eventId } = useParams();

  const {
    rows: { data },
    loading,
    error,
  } = useSelector((state: RootState) => state.listings);

  // Flatten nested listingsData
  const flattenedRows = React.useMemo(() => {
    const result: any[] = [];
    data.forEach((listing) => {
      (listing.listingsData || []).forEach((ld: any) => {
        result.push({
          _id: listing._id,
          eventId: listing.eventId,
          eventName: listing.name,
          venueId: listing.venueId,
          performerId: listing.performerId,
          row: ld.row,
          sectionName: ld.sectionName,
          longSectionName: ld.longSectionName,
          quantity: ld.quantity,
          allInPrice: ld.allInPrice,
          price: ld.price,
          serviceFee: ld.serviceFee,
          faceValue: ld.faceValue,
          tags: ld.tags?.join(", "),
          vs: ld.vs,
        });
      });
    });
    return result;
  }, [data]);


  // Fetch listings whenever eventId/filter changes
  React.useEffect(() => {
    if (!eventId) return;
    dispatch(
      getListings({
        filters: {
          items: [
            {
              id: "default",
              field: "eventId",
              operator: "equals",
              value: eventId,
            },
          ],
        },
      })
    );
  }, [dispatch, eventId]);

  const handleRefresh = () => {
    if (!eventId) return;
    dispatch(
      getListings({
        filters: {
          items: [
            {
              id: "default",
              field: "eventId",
              operator: "equals",
              value: eventId,
            },
          ],
        },
      })
    );
  };

  // all possible columns
  const allColumns: GridColDef[] = [
    { field: "row", headerName: "Row", flex: 1 },
    { field: "sectionName", headerName: "Section" },
    { field: "quantity", headerName: "Quantity", type: "number" },
    { field: "allInPrice", headerName: "All-In Price", type: "number" },
    { field: "price", headerName: "Price", type: "number" },
    { field: "serviceFee", headerName: "Service Fee", type: "number" },
    { field: "faceValue", headerName: "Face Value" },
    { field: "tags", headerName: "Tags" },
    { field: "vs", headerName: "Vs" },
  ];

  // only keep columns where at least one row has value
  const availableColumns = React.useMemo(() => {
    return allColumns.filter((col) =>
      flattenedRows.some(
        (row) =>
          row[col.field] !== null &&
          row[col.field] !== undefined &&
          row[col.field] !== ""
      )
    );
  }, [flattenedRows]);

  return (
    <Box>
      <DataGridPage
        title="Listings"
        rows={flattenedRows}
        rowCount={flattenedRows.length}
        onRefresh={handleRefresh}
        isLoading={loading}
        error={error}
        columns={availableColumns} // ✅ dynamic columns
        showToolbar
        autoHeight
      />
    </Box>
  );
}
