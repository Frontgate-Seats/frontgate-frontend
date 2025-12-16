import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";
import salesApi from "../../apis/sales.api";

export interface SalesState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  data: any;
  total: number;
  error: any;
}

const initialState: SalesState = {
  loading: false,
  rows: {
    data: [],
    total: 0,
  },
  data: {},
  total: 0,
  error: null,
};

// Async thunk to fetch listings
export const getSales = createAsyncThunk(
  "listings",
  async (data: DataGridQueryOptions, { dispatch, rejectWithValue }) => {
    try {
      const response = await salesApi.fetchSales(data);
      return response.data;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch Sales";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSales.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload.data;
      })
      .addCase(getSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const {} = salesSlice.actions;

export default salesSlice.reducer;
