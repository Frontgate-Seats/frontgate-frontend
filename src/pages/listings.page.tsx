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
import type { StepData } from "../components/common/models/types.model";
import StepperModal from "../components/common/models/stepper.model";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

// 🧩 Simulate delay utility
const simulateDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchListingDetails(listingId: string): Promise<any> {
  await simulateDelay(1000);

  // Return mocked listing details
  return {
    listing: {
      pricePer: 150,
      quantity: 6,
      section: "Lower Bowl A",
    },
    deliveryOptions: [
      { id: 1, description: "Email Delivery", cost: 0 },
      { id: 2, description: "Courier Delivery", cost: 15 },
      { id: 3, description: "Pickup", cost: 5 },
    ],
  };
}

// Step 2: Generate quote
export async function generateQuote(
  listing: any,
  quantity: number,
  deliveryOption: { id: number; cost: number }
): Promise<any> {
  await simulateDelay(1000);

  const total = listing.price * quantity + deliveryOption.cost;

  return {
    quoteId: `QUOTE-${Math.floor(Math.random() * 10000)}`,
    totalCharge: total,
    deliveryCost: deliveryOption.cost,
  };
}

// Step 3: Place order
export async function placeOrder(quoteId: string, listing: any): Promise<any> {
  await simulateDelay(1200);

  return {
    orderId: `ORDER-${Math.floor(Math.random() * 100000)}`,
    message: `Order for ${listing.sectionName} confirmed!`,
  };
}

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

  const onClose = () => setOpen(false);
  const listing = {
    listingId: "L-123",
    sectionName: "Lower Bowl",
    row: "A",
    quantity: 4,
    price: 150,
    splits: [1, 2, 3, 4],
  };

  const [quantity, setQuantity] = React.useState<number | null>(null);
  const [details, setDetails] = React.useState<any>(null);
  const [delivery, setDelivery] = React.useState<any>(null);
  const [quote, setQuote] = React.useState<any>(null);

  const steps: StepData[] = [
    // 🥇 Step 1 — Listing Details
    {
      label: "Listing Details",
      content: (
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {listing.sectionName} — Row {listing.row}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            ${listing.price} per ticket
          </Typography>

          <TextField
            select
            label="Select Quantity"
            fullWidth
            sx={{ mb: 3 }}
            value={quantity ?? ""}
            onChange={(e) => setQuantity(Number(e.target.value))}
          >
            {listing.splits.map((split) => (
              <MenuItem key={split} value={split}>
                {split}
              </MenuItem>
            ))}
          </TextField>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body1">
            <strong>Subtotal:</strong>{" "}
            {quantity
              ? `$${(listing.price * quantity).toFixed(2)}`
              : "— Select quantity —"}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            (Delivery will be added in the next step)
          </Typography>
        </Box>
      ),
      onNext: async () => {
        if (!quantity) return false;
        const res = await fetchListingDetails(listing.listingId);
        setDetails(res);
        return true;
      },
    },

    // 🥈 Step 2 — Delivery & Quote
    {
      label: "Quote",
      content: (
        <Box>
          {details && (
            <>
              <Typography variant="subtitle1" mb={2}>
                Select your delivery option:
              </Typography>

              <TextField
                select
                label="Delivery Option"
                fullWidth
                value={delivery?.id ?? ""}
                onChange={(e) => {
                  const opt = details.deliveryOptions.find(
                    (x: any) => x.id === Number(e.target.value)
                  );
                  setDelivery(opt);
                }}
              >
                {details.deliveryOptions.map((opt: any) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    {opt.description} (+${opt.cost})
                  </MenuItem>
                ))}
              </TextField>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body1">
                <strong>Subtotal:</strong> $
                {(listing.price * (quantity ?? 0)).toFixed(2)}
              </Typography>
              <Typography variant="body1">
                <strong>Delivery:</strong> $
                {delivery ? delivery.cost.toFixed(2) : "—"}
              </Typography>

              <Typography
                variant="h6"
                fontWeight={700}
                color="primary"
                sx={{ mt: 1 }}
              >
                Total: $
                {quantity
                  ? (listing.price * quantity + (delivery?.cost ?? 0)).toFixed(
                      2
                    )
                  : "—"}
              </Typography>
            </>
          )}
        </Box>
      ),
      onNext: async () => {
        if (!delivery || !quantity) return false;
        const res = await generateQuote(listing, quantity, delivery);
        setQuote(res);
        return true;
      },
    },

    // 🥉 Step 3 — Confirm Order
    {
      label: "Confirm Order",
      content: (
        <Box>
          {quote ? (
            <>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Review & Confirm
              </Typography>

              <Stack spacing={0.5}>
                <Typography>Quote ID: {quote.quoteId}</Typography>
                <Typography>
                  Delivery Cost: ${quote.deliveryCost.toFixed(2)}
                </Typography>
                <Typography>
                  Tickets: {quantity} × ${listing.price.toFixed(2)} = $
                  {(listing.price * quantity!).toFixed(2)}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" color="primary" fontWeight={700}>
                  Total: ${quote.totalCharge.toFixed(2)}
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click “Complete” to confirm your order.
              </Typography>
            </>
          ) : (
            <Box textAlign="center" py={2}>
              <CircularProgress />
            </Box>
          )}
        </Box>
      ),
      onNext: async () => {
        if (!quote) return false;
        await placeOrder(quote.quoteId, listing);
        return true;
      },
    },
  ];

  React.useEffect(() => {
    if (details && delivery && quantity) {
      const total = listing.price * quantity + delivery.cost;
      setQuote({
        totalCharge: total,
        quoteId: "TEMP",
        deliveryCost: delivery.cost,
      });
    }
  }, [delivery, quantity]);
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
      <StepperModal
        open={open}
        onClose={onClose}
        steps={steps}
        layout="vertical"
        completionContent={(_, close) => (
          <Box
            sx={{
              height: "100%",
              minHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 3,
            }}
          >
            {/* ✅ Success Icon */}
            <CheckCircleOutlineIcon
              color="success"
              sx={{
                fontSize: 90,
                mb: 2,
                animation: "popIn 0.4s ease-out",
                "@keyframes popIn": {
                  from: { transform: "scale(0.6)", opacity: 0 },
                  to: { transform: "scale(1)", opacity: 1 },
                },
              }}
            />

            {/* 🏷️ Title */}
            <Typography
              variant="h4"
              fontWeight={700}
              color="success.main"
              gutterBottom
            >
              Purchase Completed!
            </Typography>

            {/* 💬 Description */}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 460, mb: 4 }}
            >
              Your order has been successfully placed. Here’s your detailed
              summary.
            </Typography>

            {/* 📦 Order Summary */}

            <Typography
              variant="h6"
              fontWeight={600}
              color="text.primary"
              gutterBottom
            >
              Order Summary
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Stack
              spacing={1.4}
              sx={{
                width: "100%",
                maxWidth: 520,
                textAlign: "left",
                mb: 4,
              }}
            >
              {/* Inline summary rows — no separate component */}
              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">Section</Typography>
                <Typography fontWeight={500}>
                  {listing?.sectionName || "-"}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">Row</Typography>
                <Typography fontWeight={500}>{listing?.row || "-"}</Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">Tickets</Typography>
                <Typography fontWeight={500}>
                  {quantity || 0} × ${listing?.price?.toFixed(2) || "0.00"}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">Delivery</Typography>
                <Typography fontWeight={500}>
                  {delivery?.description || "-"} ($
                  {delivery?.cost?.toFixed(2) || "0.00"})
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">Quote ID</Typography>
                <Typography fontWeight={500}>
                  {quote?.quoteId || "-"}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between">
                <Typography fontWeight={700}>Total</Typography>
                <Typography fontWeight={700} color="primary.main">
                  ${quote?.totalCharge?.toFixed(2) || "0.00"}
                </Typography>
              </Box>
            </Stack>

            {/* 🔘 Close Button */}
            <Button
              variant="contained"
              color="primary"
              onClick={close}
              sx={{
                px: 6,
                py: 1.4,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              Close
            </Button>
          </Box>
        )}
      />
    </Box>
  );
}
