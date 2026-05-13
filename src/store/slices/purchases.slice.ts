import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import purchasesApi from "../../apis/purchases.api";
import { setSnackbar } from "./snackbar.slice";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";
import { getErrorMessage } from "../../shared/utils/error.util";

export interface PurchasesState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  data: any;
  error: string | null;
  success: boolean;
}

const initialState: PurchasesState = {
  loading: false,
  rows: { data: [], total: 0 },
  data: {},
  error: null,
  success: false,
};

// 🔹 Fetch Purchases
export const getPurchases = createAsyncThunk(
  "purchases/getPurchases",
  async (data: DataGridQueryOptions, { dispatch, rejectWithValue }) => {
    try {
      const response = await purchasesApi.fetchPurchases(data);
      return response;
    } catch (err: any) {
      const message = `[Purchases] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  },
);

// 🔹 Create Purchase
export const createQuote = createAsyncThunk(
  "purchases/createQuote",
  async (
    data: {
      event_id: string;
      listing_id: string;
      delivery_id: string;

      quantity: number;

      exclusiveListings?: boolean;
      shippingCountry?: string;
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const response = await purchasesApi.createQuote(data);
      const message = response?.data?.message || "Quote created successfully";
      dispatch(setSnackbar({ message, severity: "success" }));
      return response.data;
    } catch (err: any) {
      const message = `[Quote] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  },
);

export const createOrder = createAsyncThunk(
  "purchases/createOrder",
  async (
    data: {
      // Event
      event_id: string;
      event_name: string;
      event_utc_date: string;

      // Venue
      venue_id: string;
      venue_name: string;

      // Performer
      primary_performer_name: string;

      // Listing
      listing_id: string;
      delivery_id: string;
      quote_id: string;
      section: string;
      row: string;

      // Pricing
      total_amount: number;
      quantity: number;
      price_per: number;

      currency?: string;
    },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const response = await purchasesApi.createOrder(data);
      const message = response?.data?.message || "Order created successfully";
      dispatch(setSnackbar({ message, severity: "success" }));
      return response.data;
    } catch (err: any) {
      const message = `[Order] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  },
);

const purchasesSlice = createSlice({
  name: "purchases",
  initialState,
  reducers: {
    resetPurchase: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 Get Purchases
      .addCase(getPurchases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload || { data: [], total: 0 };
      })
      .addCase(getPurchases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload?.data;
      })
      .addCase(createQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload?.data;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const { resetPurchase } = purchasesSlice.actions;
export default purchasesSlice.reducer;
