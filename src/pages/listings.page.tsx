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
  TextField,
  Typography,
  MenuItem,
  Modal,
  Fade,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import { useSelector } from "react-redux";
import DataGridPage from "../components/common/datagrid.comon";
import type { RootState } from "../store";
import { getListings } from "../store/slices/listings.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { useParams } from "react-router-dom";
import { createPurchase, resetPurchase } from "../store/slices/purchases.slice";
import type { GridColDef } from "@mui/x-data-grid";

export default function ListingsPage() {
  const dispatch = useAppDispatch();
  const { eventId } = useParams();

  const {
    rows: { data: listingsData },
    loading,
    error,
  } = useSelector((state: RootState) => state.listings);

  const purchaseState = useSelector((state: RootState) => state.purchases);
  const { loading: purchaseLoading, success } = purchaseState;

  // Modal states
  const [open, setOpen] = React.useState(false);
  const [selectedListing, setSelectedListing] = React.useState<any>(null);
  const [selectedQty, setSelectedQty] = React.useState<number | null>(null);

  const eventInfo = React.useMemo(() => {
    if (!listingsData.length) return null;
    return listingsData[0].eventDBId || null;
  }, [listingsData]);

  // Flatten nested listingsData
  const flattenedRows = React.useMemo(() => {
    const result: any[] = [];
    listingsData.forEach((listing) => {
      (listing.listingsData || []).forEach((ld: any) => {
        result.push({
          id: ld.id,
          listingId: listing.id,
          listingDBId: listing._id,
          eventId: listing.eventId,
          eventDBId: listing.eventDBId,
          eventName: listing.name,
          venueId: listing.venueId,
          venueDBId: listing.venueDBId,
          performerId: listing.performerId,
          performerDBId: listing.performerDBId,
          providerDBId: listing.providerDBId,
          listingsMetaDBId: listing.listingsMetaDBId,
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
          splits: ld.splits,
          currency: listing.currency || "USD",
        });
      });
    });
    return result;
  }, [listingsData]);

  React.useEffect(() => {
    dispatch(
      getListings({
        filters: {
          items: [
            // ✅ Conditionally add eventId filter
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
      getListings({
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

  // Modal handlers
  const handleBuyClick = (listing: any) => {
    setSelectedListing(listing);
    setSelectedQty(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedListing(null);
    setSelectedQty(null);
    dispatch(resetPurchase());
  };

  const handleConfirmPurchase = async () => {
    if (!selectedListing || !selectedQty) return;

    const payload = {
      eventId: "1361816",
      listingId: "VB12712690505",
      listingDBId: selectedListing.listingDBId,
      quantity: selectedQty,
      row: selectedListing.row,
      section: selectedListing.sectionName,
      eventDBId: selectedListing.eventDBId?._id,
      venueId: selectedListing.venueId,
      venueDBId: selectedListing.venueDBId?._id,
      performerId: selectedListing.performerId,
      performerDBId: selectedListing.performerDBId?._id,
      providerDBId: selectedListing.providerDBId?._id,
    };

    await dispatch(createPurchase(payload));
  };

  // Auto-close modal on success
  React.useEffect(() => {
    if (success) {
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  }, [success]);

  // DataGrid columns
  const allColumns: GridColDef[] = [
    { field: "row", headerName: "Row", flex: 0.8, minWidth: 80 },
    { field: "sectionName", headerName: "Section", flex: 1.5, minWidth: 140 },
    { field: "quantity", headerName: "Quantity", type: "number", flex: 1 },
    {
      field: "allInPrice",
      headerName: "All-In Price",
      type: "number",
      flex: 1,
    },
    { field: "price", headerName: "Price", type: "number", flex: 1 },
    { field: "total", headerName: "Total", type: "number", flex: 1 },
    { field: "serviceFee", headerName: "Service Fee", type: "number", flex: 1 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      flex: 0,
      getActions: (params: any) => [
        <Button
          key={params.row.id}
          onClick={() => handleBuyClick(params.row)}
          variant="outlined"
          size="small"
        >
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
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {eventInfo.name}
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Date & Time
                      </Typography>
                      <Typography variant="body1">
                        {new Date(eventInfo.utcDate).toLocaleString()}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Venue
                      </Typography>
                      <Typography variant="body1">
                        {eventInfo.venue?.name || eventInfo.venueId}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Category
                      </Typography>
                      <Typography variant="body1">
                        {eventInfo.category}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Price Range
                      </Typography>
                      <Typography variant="body1">
                        ${eventInfo.minPrice} – ${eventInfo.maxPrice}
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
          />
        </Box>
      )}

      {/* BUY MODAL */}
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: { timeout: 400 },
        }}
      >
        <Fade in={open}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              maxWidth: 500,
              bgcolor: "background.paper",
              borderRadius: 3,
              boxShadow: 24,
              p: 4,
              outline: "none",
            }}
          >
            {selectedListing ? (
              <Stack spacing={3}>
                <Typography variant="h5" fontWeight={700} textAlign="center">
                  Confirm Purchase
                </Typography>

                <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedListing.eventName}
                  </Typography>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary">
                        Section
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedListing.sectionName}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Row
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedListing.row}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Price / Ticket
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        ${selectedListing.price}
                      </Typography>
                    </Grid>
                    {/* <Grid size={{xs:6}}>
                      <Typography variant="body2" color="text.secondary">
                        Available Quantities
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedListing.splits?.join(", ")}
                      </Typography>
                    </Grid>*/}
                  </Grid>
                </Card>

                <TextField
                  select
                  label="Select Quantity"
                  fullWidth
                  value={selectedQty ?? ""}
                  onChange={(e) => setSelectedQty(Number(e.target.value))}
                >
                  {selectedListing.splits?.map((split: number) => (
                    <MenuItem key={split} value={split}>
                      {split}
                    </MenuItem>
                  ))}
                </TextField>

                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                  <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="inherit"
                    disabled={purchaseLoading}
                    sx={{ borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmPurchase}
                    variant="contained"
                    disabled={purchaseLoading || !selectedQty}
                    sx={{ borderRadius: 2 }}
                  >
                    {purchaseLoading ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      "Confirm"
                    )}
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Typography textAlign="center">No listing selected</Typography>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}
