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
export const createPurchase = createAsyncThunk(
  "purchases/createPurchase",
  async (
    data: {
      quantity: number;
      row: string;
      section: string;
      eventId: string;
      eventDBId: string;
      venueId: string;
      venueDBId: string;
      performerId: string;
      performerDBId: string;
      listingId: string;
      listingDBId: string;
      providerDBId: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await purchasesApi.createPurchase(data);
      const message = response?.data?.message || "Purchase created successfully";
      dispatch(setSnackbar({ message, severity: "success" }));
      return response.data;
    } catch (err: any) {
      const message = err?.message || "Failed to create purchase";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const purchasesSlice = createSlice({
  name: "purchases",
  initialState,
  reducers: {
    resetPurchase: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = {};
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

      // 🔹 Create Purchase
      .addCase(createPurchase.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createPurchase.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload?.data || {};
      })
      .addCase(createPurchase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const { resetPurchase } = purchasesSlice.actions;
export default purchasesSlice.reducer;
