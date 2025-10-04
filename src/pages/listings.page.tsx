import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import DataGridPage from "../components/common/datagrid.comon";
import type { GridColDef } from "@mui/x-data-grid";
import type { RootState } from "../store";
import { getListings } from "../store/slices/listings.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { useParams } from "react-router-dom";

export default function ListingsPage() {
  const dispatch = useAppDispatch();
  const { eventId } = useParams();

  const {
    rows: { data },
    loading,
    error,
  } = useSelector((state: RootState) => state.listings);
console.log("data : ", data)
  const eventInfo = React.useMemo(() => {
    if (!data.length) return null;
    return data[0].eventDBId || null;
  }, [data]);

  // Flatten nested listingsData
  const flattenedRows = React.useMemo(() => {
    const result: any[] = [];
    data.forEach((listing) => {
      (listing.listingsData || []).forEach((ld: any) => {
        result.push({
          id: ld.id,
          listingId: listing.id,
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
          total: ld.total,
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
    { field: "sectionName", headerName: "Section", flex: 1 },
    { field: "quantity", headerName: "Quantity", type: "number", flex: 1 },
    { field: "allInPrice", headerName: "All-In Price", type: "number", flex: 1 },
    { field: "price", headerName: "Price", type: "number", flex: 1 },
    { field: "total", headerName: "Total", type: "number", flex: 1 },
    { field: "serviceFee", headerName: "Service Fee", type: "number", flex: 1 },
    {
      field: "actions",
      type: "actions",
      width: 100,
      flex: 1,
      getActions: (params) => [
        <Button key={params.row.eventId} onClick={() => {}} variant="outlined">
          Buy
        </Button>,
      ],
    },
  ];

  return (
    <Box>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box>
          {eventInfo && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                {/* Event name */}
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {eventInfo.name}
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  {/* Date & Time */}
                  <Grid size={{xs:12, sm: 6, md: 4}}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Date & Time
                      </Typography>
                      <Typography variant="body1">
                        {new Date(eventInfo.utcDate).toLocaleString()}
                      </Typography>
                    </Stack>
                  </Grid>

                  {/* Venue */}
                  <Grid size={{xs:12, sm: 6, md: 4}}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Venue
                      </Typography>
                      <Typography variant="body1">
                        {/* ideally populate venueDBId.name in backend */}
                        {eventInfo.venue?.name || eventInfo.venueId}
                      </Typography>
                    </Stack>
                  </Grid>

                  {/* Category */}
                  <Grid size={{xs:12, sm: 6, md: 4}}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Category
                      </Typography>
                      <Typography variant="body1">
                        {eventInfo.category}
                      </Typography>
                    </Stack>
                  </Grid>

                  {/* Price Range */}
                  <Grid size={{xs:12, sm: 6, md: 4}}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Price Range
                      </Typography>
                      <Typography variant="body1">
                        {eventInfo.currency} {eventInfo.minPrice} –{" "}
                        {eventInfo.maxPrice}
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          <DataGridPage
            title="Listings"
            rows={flattenedRows}
            rowCount={flattenedRows.length}
            onRefresh={handleRefresh}
            isLoading={loading}
            error={error}
            columns={allColumns}
            showToolbar
            autoHeight
          />
        </Box>
      )}
    </Box>
  );
}
