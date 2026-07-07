import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import stubhubSalesApi from "../../apis/stubhubSales.api";
import { getErrorMessage } from "../../shared/utils/error.util";

export interface StubhubSalesState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  error: any;
}

const initialState: StubhubSalesState = {
  loading: false,
  rows: {
    data: [],
    total: 0,
  },
  error: null,
};

/**
 * Fetch StubHub sales by StubHub event ID.
 * Same pattern as SeatGeek: the caller resolves the external event ID from mappings
 * and passes it directly.
 */
export const getStubhubSales = createAsyncThunk(
  "stubhubSales/fetchStubhubSales",
  async (stubhubEventId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await stubhubSalesApi.fetchStubhubSales(stubhubEventId);
      return response;
    } catch (err: any) {
      const message = `[StubHub Sales] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const stubhubSalesSlice = createSlice({
  name: "stubhubSales",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getStubhubSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStubhubSales.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
      })
      .addCase(getStubhubSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default stubhubSalesSlice.reducer;
