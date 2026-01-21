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
  CircularProgress,
  Paper,
  Link,
} from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { getListings } from "../store/slices/listings.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { useNavigate, useParams } from "react-router-dom";
import type { StepData } from "../components/common/models/types.model";
import StepperModal from "../components/common/models/stepper.model";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  getSingleListingsDetails,
  resetListingDetails,
} from "../store/slices/listingsDetails.slice";
import {
  createOrder,
  createQuote,
  resetPurchase,
} from "../store/slices/purchases.slice";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { formatDateTime } from "../shared/utils/dateTime.util";
import { useClientFilters } from "../hooks/useClientFilters";

export default function ListingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { eventId } = useParams();

  const {
    rows: { data: listingsData },
    loading: listingLoading,
    error: listingsError,
  } = useSelector((state: RootState) => state.listings);

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

  // Modal states
  const [openModel, setOpenModel] = React.useState(false);
  const [selectedListing, setSelectedListing] = React.useState<any>({});
  const [quantity, setQuantity] = React.useState<number>(0);
  const [deliveryId, setDeliveryId] = React.useState("");
  const [modelActiveStep, setModelActiveStep] = React.useState(0);
  const [modelCompleted, setMdelCompleted] = React.useState(false);

  const eventInfo = React.useMemo(() => {
    if (!listingsData?.length) return {};
    return listingsData?.[0]?.eventDBId || {};
  }, [listingsData]);

  const venueInfo = React.useMemo(() => {
    if (!listingsData?.length) return {};
    return listingsData?.[0]?.venueDBId || {};
  }, [listingsData]);

  const performerInfo = React.useMemo(() => {
    if (!listingsData?.length) return {};
    return listingsData?.[0]?.performerDBId || {};
  }, [listingsData]);

  // Fetch all listings data once
  React.useEffect(() => {
    if (eventId) dispatch(getListings(eventId));
  }, [dispatch, eventId]);

  const allColumns: CustomGridColDef[] = [
    {
      field: "id",
      headerName: "Listing Id",
      type: "string",
      width: 140,
      flex: 0.8,
      minWidth: 120,
    },
    {
      field: "sectionName",
      headerName: "Section",
      type: "string",
      width: 180,
      flex: 1.2,
      minWidth: 150,
    },
    {
      field: "row",
      headerName: "Row",
      type: "string",
      width: 70,
      flex: 0.4,
      minWidth: 60,
    },
    {
      field: "quantity",
      headerName: "Qty",
      width: 70,
      flex: 0.4,
      minWidth: 60,
      type: "number",
      min: 0,
      max: 10000,
    },
    {
      field: "price",
      headerName: "Price",
      type: "number",
      width: 100,
      flex: 0.6,
      minWidth: 80,
      min: 0,
      max: 10000,
      valueFormatter: (value) => (value ? `$${value}` : "-"),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      flex: 0.5,
      minWidth: 90,
      sortable: false,
      filterable: false,
      getActions: (params: any) => [
        <Button
          key={params.row.id}
          onClick={() => handleBuyClick(params.row)}
          variant="contained"
          color="primary"
          size="small"
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Buy
        </Button>,
      ],
    },
  ];

  // Use client-side filtering, pagination, and sorting
  const {
    paginationModel,
    sortModel,
    filterModel,
    setPaginationModel,
    setSortModel,
    setFilterModel,
    paginatedRows,
    totalFilteredRows,
  } = useClientFilters({
    data: listingsData || [],
    columns: allColumns,
    initialPaginationModel: { page: 0, pageSize: 25 },
    initialSortModel: [],
    initialFilterModel: {
      items: [],
    },
  });

  const handleRefresh = () => {
    if (eventId) dispatch(getListings(eventId));
  };

  const handleBuyClick = (listing: any) => {
    setSelectedListing(listing);
    setModelActiveStep(0);
    setMdelCompleted(false);
    setOpenModel(true);
  };

  const handleModelClose = () => {
    setSelectedListing({});
    setModelActiveStep(0);
    setMdelCompleted(false);
    setOpenModel(false);
    resetPurchase();
    resetListingDetails();
  };

  React.useEffect(() => {
    setQuantity(
      Number(
        selectedListing?.splits?.[selectedListing?.splits?.length - 1] ?? 0,
      ),
    );
  }, [selectedListing?.splits]);

  React.useEffect(() => {
    setDeliveryId(
      String(listingsDetailsDataObj?.deliveryOptions?.[0]?.id ?? ""),
    );
  }, [listingsDetailsDataObj?.deliveryOptions]);

  const steps: StepData[] = [
    {
      label: "Listing Details",
      content: (
        <Box>
          <Box
            display="flex"
            gap={2}
            alignItems="center"
            flexWrap="wrap"
            mb={2}
          >
            <Typography variant="body2">
              <strong>Row:</strong> {selectedListing?.row}
            </Typography>
            <Typography variant="body2">
              <strong>Subtotal:</strong> {selectedListing?.section}
            </Typography>
            <Typography variant="body2">
              <strong>Price:</strong> ${selectedListing?.price} per ticket
            </Typography>
          </Box>
          <TextField
            select
            label="Select Quantity"
            fullWidth
            sx={{ mb: 3 }}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          >
            {selectedListing?.splits?.map((split: any) => (
              <MenuItem key={split} value={split}>
                {split}
              </MenuItem>
            ))}
          </TextField>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              background: "rgba(0,0,0,0.02)",
              borderRadius: 2,
            }}
          >
            <Typography variant="body1">
              <strong>Subtotal:</strong>{" "}
              {quantity
                ? `$${(selectedListing?.price * quantity).toFixed(2)}`
                : "— Select quantity —"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Delivery cost added next.
            </Typography>
          </Paper>
        </Box>
      ),
      nextButton: (
        <Button
          variant="contained"
          onClick={async () => {
            await dispatch(
              getSingleListingsDetails({
                listingDBId: selectedListing?._id as string,
                listingId: selectedListing?.listingId as string,
                quantity,
              }),
            );
            setModelActiveStep((prev) => prev + 1);
          }}
          disabled={!quantity}
          loading={listingsDetailsLoading}
          sx={{ borderRadius: 2 }}
        >
          Next
        </Button>
      ),
    },

    {
      label: "Quote",
      content: (
        <Box>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Select Delivery Option
          </Typography>

          <TextField
            select
            label="Delivery Method"
            fullWidth
            value={deliveryId}
            onChange={(e) => setDeliveryId(String(e.target.value))}
          >
            {listingsDetailsDataObj?.deliveryOptions?.map((opt: any) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.description} (+${opt.cost})
              </MenuItem>
            ))}
          </TextField>

          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              background: "rgba(0,0,0,0.02)",
            }}
          >
            <Typography>
              <strong>Subtotal:</strong> $
              {(listingsDetailsDataObj?.listing?.pricePer * quantity).toFixed(
                2,
              )}
            </Typography>
            <Typography>
              <strong>Delivery:</strong> $
              {listingsDetailsDataObj?.deliveryOptions
                ?.find((x: any) => String(x.id) === String(deliveryId))
                ?.cost?.toFixed(2) ?? 0.0}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="h6" fontWeight={700} color="primary">
              Total: $
              {quantity
                ? (
                    listingsDetailsDataObj?.listing?.pricePer * quantity +
                    (listingsDetailsDataObj?.deliveryOptions?.find(
                      (x: any) => String(x.id) === String(deliveryId),
                    )?.cost ?? 0)
                  ).toFixed(2)
                : "-"}
            </Typography>
          </Paper>
        </Box>
      ),
      nextButton: (
        <Button
          variant="contained"
          onClick={async () => {
            await dispatch(
              createQuote({
                listingDBId: selectedListing?._id,
                listingId: selectedListing?.listingId,
                quantity,
                deliveryMethodId: deliveryId,
              }),
            );
            setModelActiveStep((prev) => prev + 1);
          }}
          disabled={!deliveryId}
          loading={purchasesLoading}
          sx={{ borderRadius: 2 }}
        >
          Get Quote
        </Button>
      ),
    },

    {
      label: "Order",
      content: (
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Review & Confirm
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Typography>Quote ID: {purchasesDataObj?.id}</Typography>
              <Typography>
                Tickets: {quantity} × $
                {listingsDetailsDataObj?.listing?.pricePer}
              </Typography>
              <Typography>
                Delivery: $
                {listingsDetailsDataObj?.deliveryOptions
                  ?.find((x: any) => String(x.id) === String(deliveryId))
                  ?.cost?.toFixed(2)}
              </Typography>
              <Divider />
              <Typography variant="h6" color="primary" fontWeight={700}>
                Total: ${purchasesDataObj?.totalCharge?.toFixed(2)}
              </Typography>
            </Stack>
          </Paper>
        </Box>
      ),
      nextButton: (
        <Button
          variant="contained"
          onClick={async () => {
            await dispatch(
              createOrder({
                listingDBId: selectedListing?._id,
                listingId: selectedListing?.listingId,
                deliveryMethodId: deliveryId,
                quoteId: purchasesDataObj?.id,
                totalAmount: purchasesDataObj?.totalCharge,
                pricePer: listingsDetailsDataObj?.listing?.pricePer,
                quantity,
              }),
            );
            setMdelCompleted(true);
          }}
          loading={purchasesLoading}
          sx={{ borderRadius: 2 }}
        >
          Confirm Order
        </Button>
      ),
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
      <Grid container spacing={3}>
        {listingsError ? (
          <Alert severity="error">{listingsError}</Alert>
        ) : (
          <>
            <Grid size={{ xs: 12 }}>
              {eventInfo?.name && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      {eventInfo?.name}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Date & Time
                        </Typography>
                        <Typography variant="body1">
                          {eventInfo?.localDate
                            ? formatDateTime(eventInfo?.localDate)
                            : ""}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Venue
                        </Typography>
                        <Typography variant="body1">
                          {venueInfo
                            ? `${venueInfo?.city}, ${venueInfo?.stateCode} (${venueInfo.countryCode})`
                            : "-"}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Performer
                        </Typography>
                        <Typography variant="body1">
                          {performerInfo ? `${performerInfo?.name}` : "-"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CustomDataGrid
                title="Listings"
                rows={paginatedRows}
                rowCount={totalFilteredRows}
                isLoading={listingLoading}
                error={listingsError}
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
      {/* Stepper Modal */}
      <StepperModal
        open={openModel}
        onClose={handleModelClose}
        steps={steps}
        activeStep={modelActiveStep}
        setActiveStep={setModelActiveStep}
        completed={modelCompleted}
        error={listingsDetailsError || purchaseError}
        initialLoading={false}
        loadingContent={
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={48} />
            <Typography>Fetching your order details...</Typography>
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
              animation: "fadeIn 0.5s ease-out",
              "@keyframes fadeIn": {
                from: { opacity: 0, transform: "translateY(10px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={1.5}
              justifyContent="center"
              mb={3}
            >
              <CheckCircleOutlineIcon
                color="success"
                sx={{ fontSize: 50, animation: "popIn 0.4s ease-out" }}
              />
              <Typography variant="h4" fontWeight={700} color="success.main">
                Purchase Successful
              </Typography>
            </Box>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 480, mb: 3 }}
            >
              Your order has been successfully processed. Here’s your summary.
            </Typography>

            <Card
              variant="outlined"
              sx={{
                p: 3,
                width: "100%",
                maxWidth: 520,
                borderRadius: 3,
                boxShadow: 1,
              }}
            >
              <Stack spacing={1.5}>
                {[
                  ["Event", eventInfo?.name || "—"],
                  [
                    "Date & Time",
                    eventInfo?.localDate
                      ? formatDateTime(eventInfo?.localDate)
                      : "-",
                  ],
                  [
                    "Venue",
                    venueInfo
                      ? `${venueInfo?.city}, ${venueInfo?.stateCode} (${venueInfo.countryCode})`
                      : "-",
                  ],
                  ["Performer", performerInfo?.name || "-"],
                  ["Row", selectedListing?.row],
                  ["Section", selectedListing?.section],
                  [
                    "Tickets",
                    `${quantity || 0} × $${
                      listingsDetailsDataObj?.listing?.pricePer?.toFixed(2) ||
                      "0.00"
                    }`,
                  ],
                  [
                    "Delivery",
                    `${
                      listingsDetailsDataObj?.deliveryOptions?.find(
                        (x: any) => String(x.id) === String(deliveryId),
                      )?.description || "-"
                    } ($${
                      listingsDetailsDataObj?.deliveryOptions
                        ?.find((x: any) => String(x.id) === String(deliveryId))
                        ?.cost?.toFixed(2) || "0.00"
                    })`,
                  ],
                  ["Order ID", purchasesDataObj?.id || "-"],
                ].map(([label, value]) => (
                  <Box
                    key={label}
                    display="flex"
                    justifyContent="space-between"
                  >
                    <Typography color="text.secondary" maxWidth={150}>
                      {label}
                    </Typography>
                    <Typography
                      fontWeight={500}
                      maxWidth={250}
                      textAlign="right"
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 1.5 }} />

                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight={700}>Total</Typography>
                  <Typography fontWeight={700} color="primary.main">
                    ${purchasesDataObj?.payment?.paid?.toFixed(2) || "0.00"}
                  </Typography>
                </Box>
              </Stack>
            </Card>

            <Button
              variant="contained"
              color="primary"
              onClick={(e) => {
                close();
                e.stopPropagation();
                const url = `/purchases`;
                if (e.ctrlKey || e.metaKey) {
                  window.open(url, "_blank");
                } else {
                  navigate(url);
                }
              }}
              sx={{
                mt: 4,
                px: 6,
                py: 1.4,
                borderRadius: 3,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Close
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
              animation: "fadeIn 0.5s ease-out",
              "@keyframes fadeIn": {
                from: { opacity: 0, transform: "translateY(10px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            <ErrorOutlineIcon color="error" sx={{ fontSize: 100, mb: 1 }} />

            <Typography variant="h4" fontWeight={700} color="error.main">
              Error
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 480, mb: 3 }}
            >
              {"Something went wrong during the transaction. Please retry."}
            </Typography>

            <Button
              variant="contained"
              color="error"
              onClick={close}
              sx={{
                px: 4,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Cancel
            </Button>
          </Box>
        )}
        headerContent={(_) =>
          eventInfo?.name ? (
            <Card
              variant="outlined"
              sx={{
                mb: 1,
                borderRadius: 2,
                p: 0,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <CardContent
                sx={{
                  p: 1.5, // balanced compact padding
                  "&:last-child": { pb: 1.5 },
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  {eventInfo?.name || "—"}
                </Typography>

                <Divider sx={{ mb: 1 }} />

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1 }}
                      fontWeight={600}
                    >
                      Date & Time
                    </Typography>
                    <Typography variant="caption">
                      {eventInfo?.localDate
                        ? formatDateTime(eventInfo?.localDate)
                        : "-"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1 }}
                      fontWeight={600}
                    >
                      Venue
                    </Typography>
                    <Typography variant="caption">
                      {venueInfo
                        ? `${venueInfo?.city}, ${venueInfo?.stateCode} (${venueInfo.countryCode})`
                        : "-"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1 }}
                      fontWeight={600}
                    >
                      Performer
                    </Typography>
                    <Typography variant="caption">
                      {performerInfo?.name || "-"}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <></>
          )
        }
        layout="vertical"
      />
    </Stack>
  );
}
