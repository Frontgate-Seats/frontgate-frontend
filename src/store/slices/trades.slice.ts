import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import tradesApi from "../../apis/trades.api";
import { setSnackbar } from "./snackbar.slice";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";
import { getErrorMessage } from "../../shared/utils/error.util";

export interface TradesState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  error: any | null;
}

const initialState: TradesState = {
  loading: false,
  rows: { data: [], total: 0 },
  error: null,
};

export const getTrades = createAsyncThunk(
  "trades/fetchTrades",
  async (data: DataGridQueryOptions, { dispatch, rejectWithValue }) => {
    try {
      const response = await tradesApi.fetchTrades(data);
      return response;
    } catch (err: any) {
      const message = `[Trades] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const tradesSlice = createSlice({
  name: "trades",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getTrades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTrades.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
      })
      .addCase(getTrades.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default tradesSlice.reducer;
