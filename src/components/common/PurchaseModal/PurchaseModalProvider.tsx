import * as React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import EventIcon from "@mui/icons-material/Event";
import PlaceIcon from "@mui/icons-material/Place";
import PersonIcon from "@mui/icons-material/Person";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";

import type { RootState } from "../../../store";
import { useAppDispatch } from "../../../store/reducers/root.reducer";
import {
  getSingleListingsDetails,
  resetListingDetails,
} from "../../../store/slices/listingsDetails.slice";
import {
  createOrder,
  createQuote,
  resetPurchase,
} from "../../../store/slices/purchases.slice";
import { formatDateTime } from "../../../shared/utils/dateTime.util";
import StepperModal from "../models/stepper.model";
import type { StepData } from "../models/types.model";
import {
  PurchaseModalContext,
  type PurchaseListingData,
  type PurchaseEventData,
} from "./PurchaseModalContext";
import moment from "moment";

export default function PurchaseModalProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Modal state
  const [open, setOpen] = React.useState(false);
  const [selectedListing, setSelectedListing] = React.useState<PurchaseListingData | null>(null);
  const [eventData, setEventData] = React.useState<PurchaseEventData | null>(null);
  const [quantity, setQuantity] = React.useState<number>(0);
  const [deliveryId, setDeliveryId] = React.useState("");
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState(false);
  const [purchasing, setPurchasing] = React.useState(false);

  // Redux state
  const {
    data: listingsDetailsDataObj,
    loading: listingsDetailsLoading,
    error: listingsDetailsError,
  } = useSelector((state: RootState) => state.listingsDetails);
  const {
    data: purchasesDataObj,
    loading: purchasesLoading,
    error: purchaseError,
  } = useSelector((state: RootState) => state.purchases);

  // Auto-select delivery when options load
  React.useEffect(() => {
    setDeliveryId(String(listingsDetailsDataObj?.deliveryOptions?.[0]?.id ?? ""));
  }, [listingsDetailsDataObj?.deliveryOptions]);

  const openPurchaseModal = React.useCallback((listing: PurchaseListingData, event: PurchaseEventData) => {
    setSelectedListing(listing);
    setEventData(event);
    setActiveStep(0);
    setCompleted(false);
    setPurchasing(false);
    setOpen(true);

    // Immediately fetch listing details for quantity/delivery options
    dispatch(
      getSingleListingsDetails({
        event_id: event.id,
        listing_id: listing.id,
        quantity: listing.quantity || 1,
      }),
    );
  }, [dispatch]);

  const closePurchaseModal = React.useCallback(() => {
    setOpen(false);
    setSelectedListing(null);
    setEventData(null);
    setQuantity(0);
    setDeliveryId("");
    setActiveStep(0);
    setCompleted(false);
    setPurchasing(false);
    dispatch(resetPurchase());
    dispatch(resetListingDetails());
  }, [dispatch]);

  // Handle the purchase flow: quote → order in one click
  const handlePurchase = React.useCallback(async () => {
    if (!eventData || !selectedListing || !deliveryId) return;
    setPurchasing(true);

    try {
      // Step 1: Create quote
      const quoteResult = await dispatch(
        createQuote({
          event_id: eventData.id,
          listing_id: selectedListing.id,
          quantity,
          delivery_id: deliveryId,
        }),
      ).unwrap();

      // Step 2: Create order using the quote
      await dispatch(
        createOrder({
          event_id: eventData.id,
          event_name: eventData.name,
          event_utc_date: eventData.local_date || eventData.utc_date || "",
          primary_performer_name: eventData.primary_performer_name || "",
          venue_id: eventData.venue_id || "",
          venue_name: eventData.venue_name || "",
          listing_id: selectedListing.id,
          price_per: listingsDetailsDataObj?.listing?.pricePer || selectedListing.price,
          row: selectedListing.row,
          section: selectedListing.section_name,
          total_amount: quoteResult?.data?.totalCharge || 0,
          quote_id: quoteResult?.data?.id || "",
          delivery_id: deliveryId,
          quantity,
        }),
      ).unwrap();

      setCompleted(true);
    } catch {
      // Error handled by redux slice (snackbar)
    } finally {
      setPurchasing(false);
    }
  }, [dispatch, eventData, selectedListing, deliveryId, quantity, listingsDetailsDataObj]);

  // Steps — simplified to 2
  const steps: StepData[] = [
    {
      label: "Select Quantity & Delivery",
      content: (
        <Box>
          {/* Listing info card */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: "action.hover" }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <ConfirmationNumberIcon sx={{ fontSize: 18, color: "primary.main" }} />
              <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                Ticket Details
              </Typography>
            </Stack>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Box>
                <Typography variant="caption" color="text.secondary">Section</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedListing?.section_name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Row</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedListing?.row}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Price per ticket</Typography>
                <Typography variant="body2" fontWeight={600} color="primary.main">
                  ${listingsDetailsDataObj?.listing?.pricePer ?? selectedListing?.price}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Form fields side by side */}
          <Stack direction="row" spacing={2} mb={2.5}>
            <TextField
              select
              label="Quantity"
              fullWidth
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={listingsDetailsLoading}
              size="small"
            >
              {(listingsDetailsDataObj?.listing?.splits ?? selectedListing?.splits ?? [selectedListing?.quantity ?? 1]).map(
                (split: any) => (
                  <MenuItem key={split} value={split}>
                    {split}
                  </MenuItem>
                ),
              )}
            </TextField>
            <TextField
              select
              label="Delivery Method"
              fullWidth
              value={deliveryId}
              onChange={(e) => setDeliveryId(String(e.target.value))}
              disabled={listingsDetailsLoading || !listingsDetailsDataObj?.deliveryOptions?.length}
              size="small"
            >
              {listingsDetailsDataObj?.deliveryOptions?.map((opt: any) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.description} (+${opt.cost})
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {/* Price summary */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={0.75}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {quantity
                    ? `$${((listingsDetailsDataObj?.listing?.pricePer ?? selectedListing?.price ?? 0) * quantity).toFixed(2)}`
                    : "—"}
                </Typography>
              </Stack>
              {deliveryId && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Delivery</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    ${listingsDetailsDataObj?.deliveryOptions
                      ?.find((x: any) => String(x.id) === String(deliveryId))
                      ?.cost?.toFixed(2) ?? "0.00"}
                  </Typography>
                </Stack>
              )}
              {quantity && deliveryId && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight={700}>Total</Typography>
                    <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                      ${(
                        (listingsDetailsDataObj?.listing?.pricePer ?? selectedListing?.price ?? 0) * quantity +
                        (listingsDetailsDataObj?.deliveryOptions?.find(
                          (x: any) => String(x.id) === String(deliveryId),
                        )?.cost ?? 0)
                      ).toFixed(2)}
                    </Typography>
                  </Stack>
                </>
              )}
            </Stack>
          </Paper>
        </Box>
      ),
      nextButton: (
        <Button
          variant="contained"
          onClick={handlePurchase}
          disabled={!quantity || !deliveryId || listingsDetailsLoading}
          loading={purchasing || purchasesLoading}
          sx={{ borderRadius: 2 }}
        >
          Purchase
        </Button>
      ),
    },
  ];

  const contextValue = React.useMemo(
    () => ({ openPurchaseModal, closePurchaseModal }),
    [openPurchaseModal, closePurchaseModal],
  );

  return (
    <PurchaseModalContext.Provider value={contextValue}>
      {children}
      <StepperModal
        open={open}
        onClose={closePurchaseModal}
        steps={steps}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        completed={completed}
        error={!!(listingsDetailsError || purchaseError)}
        initialLoading={listingsDetailsLoading}
        loadingContent={
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={48} />
            <Typography>Loading listing details...</Typography>
          </Stack>
        }
        successContent={(close) => (
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
              gap: 1,
            }}
          >
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 50 }} />
            <Typography variant="h4" fontWeight={700} color="success.main">
              Purchase Successful
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mb: 3 }}>
              Your order has been successfully processed.
            </Typography>
            <Card variant="outlined" sx={{ p: 3, width: "100%", maxWidth: 560, borderRadius: 3 }}>
              <Stack spacing={0}>
                {/* Event Info */}
                <Typography variant="overline" color="text.secondary" sx={{ mb: 1 }}>
                  Event Information
                </Typography>
                {[
                  ["Event", eventData?.name || "—"],
                  ["Performer", eventData?.primary_performer_name || "—"],
                  ["Venue", eventData?.venue_name || "—"],
                  ["Event Date", (eventData?.local_date || eventData?.utc_date) ? formatDateTime(moment.parseZone(eventData?.local_date || eventData?.utc_date)) : "—"],
                ].map(([label, value]) => (
                  <Box key={label} display="flex" justifyContent="space-between" py={0.75}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 1.5 }} />

                {/* Ticket Info */}
                <Typography variant="overline" color="text.secondary" sx={{ mb: 1 }}>
                  Ticket Details
                </Typography>
                {[
                  ["Section", selectedListing?.section_name || "—"],
                  ["Row", selectedListing?.row || "—"],
                  ["Quantity", String(quantity || 0)],
                  ["Price per Ticket", `$${(listingsDetailsDataObj?.listing?.pricePer ?? selectedListing?.price)?.toFixed?.(2) || "0.00"}`],
                  ["Delivery", listingsDetailsDataObj?.deliveryOptions?.find((x: any) => String(x.id) === String(deliveryId))?.description || "—"],
                ].map(([label, value]) => (
                  <Box key={label} display="flex" justifyContent="space-between" py={0.75}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 1.5 }} />

                {/* Payment Info */}
                <Typography variant="overline" color="text.secondary" sx={{ mb: 1 }}>
                  Payment
                </Typography>
                {[
                  ["Delivery Cost", `$${listingsDetailsDataObj?.deliveryOptions?.find((x: any) => String(x.id) === String(deliveryId))?.cost?.toFixed(2) || "0.00"}`],
                  ["Order ID", purchasesDataObj?.id || "—"],
                ].map(([label, value]) => (
                  <Box key={label} display="flex" justifyContent="space-between" py={0.75}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                  </Box>
                ))}
                <Box display="flex" justifyContent="space-between" py={1} mt={0.5} sx={{ borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="success.main">
                    ${purchasesDataObj?.payment?.paid?.toFixed(2) || purchasesDataObj?.totalCharge?.toFixed(2) || "0.00"}
                  </Typography>
                </Box>
              </Stack>
            </Card>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                close();
                navigate("/purchases");
              }}
              sx={{ mt: 4, px: 6, py: 1.4, borderRadius: 3, fontWeight: 600, textTransform: "none" }}
            >
              View Purchases
            </Button>
          </Box>
        )}
        errorContent={(close) => (
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
              gap: 2,
            }}
          >
            <ErrorOutlineIcon color="error" sx={{ fontSize: 100 }} />
            <Typography variant="h4" fontWeight={700} color="error.main">
              Error
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mb: 1 }}>
              {listingsDetailsError || purchaseError || "Something went wrong during the transaction."}
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={close}
              sx={{ px: 4, py: 1.2, borderRadius: 2, fontWeight: 600, textTransform: "none" }}
            >
              Cancel
            </Button>
          </Box>
        )}
        headerContent={() =>
          eventData?.name ? (
            <Card variant="outlined" sx={{ mb: 1.5, borderRadius: 2, overflow: "hidden" }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
                    {eventData.name}
                  </Typography>
                  {eventData.event_url && (
                    <Link
                      href={eventData.event_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.75rem", whiteSpace: "nowrap", ml: 1 }}
                    >
                      VividSeats <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </Link>
                  )}
                </Stack>
                <Stack direction="row" spacing={2} flexWrap="wrap" mt={1} alignItems="center">
                  {eventData.venue_name && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <PlaceIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">
                        {eventData.venue_name}
                      </Typography>
                    </Stack>
                  )}
                  {(eventData.local_date || eventData.utc_date) && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <EventIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(moment.parseZone(eventData.local_date))}
                      </Typography>
                    </Stack>
                  )}
                  {eventData.primary_performer_name && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <PersonIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">
                        {eventData.primary_performer_name}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <></>
          )
        }
        layout="vertical"
      />
    </PurchaseModalContext.Provider>
  );
}
