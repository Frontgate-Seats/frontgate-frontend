import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import salesApi from "../../apis/sales.api";
import { getErrorMessage } from "../../shared/utils/error.util";

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
  "sales/fetchSales",
  async (event_id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await salesApi.fetchSales(event_id);
      return response;
    } catch (err: any) {
      const message = `[Sales] ${getErrorMessage(err)}`;
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
        state.rows = action.payload;
      })
      .addCase(getSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const {} = salesSlice.actions;

export default salesSlice.reducer;
