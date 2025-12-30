import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import purchasesApi from "../../apis/purchases.api";
import { setSnackbar } from "./snackbar.slice";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";

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
      return response.data;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch purchases";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

// 🔹 Create Purchase
export const createQuote = createAsyncThunk(
  "purchases/createQuote",
  async (
    data: {
      listingDBId: string;
      listingId: string;
      deliveryMethodId: string;

      quantity: number;

      exclusiveListings?: boolean;
      shippingCountry?: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await purchasesApi.createQuote(data);
      const message = response?.data?.message || "Quote created successfully";
      dispatch(setSnackbar({ message, severity: "success" }));
      return response.data;
    } catch (err: any) {
      const message = err?.message || "Failed to create Quote";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

export const createOrder = createAsyncThunk(
  "purchases/createOrder",
  async (
    data: {
      listingDBId: string;
      listingId: string;
      deliveryMethodId: string;
      quoteId: string;
      totalAmount: number;
      quantity: number;
      pricePer: number;

      currency?: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await purchasesApi.createOrder(data);
      const message = response?.data?.message || "Order created successfully";
      dispatch(setSnackbar({ message, severity: "success" }));
      return response.data;
    } catch (err: any) {
      const message = err?.message || "Failed to create Order";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
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
        state.rows = action.payload?.data || { data: [], total: 0 };
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
