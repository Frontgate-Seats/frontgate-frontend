import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import vividSalesApi from "../../apis/vividSales.api";
import { getErrorMessage } from "../../shared/utils/error.util";

export interface VividSalesState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  error: any;
}

const initialState: VividSalesState = {
  loading: false,
  rows: {
    data: [],
    total: 0,
  },
  error: null,
};

// Async thunk to fetch Vivid sales
export const getVividSales = createAsyncThunk(
  "vividSales/fetchVividSales",
  async (eventId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await vividSalesApi.fetchVividSales(eventId);
      return response;
    } catch (err: any) {
      const message = `[Vivid Sales] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const vividSalesSlice = createSlice({
  name: "vividSales",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getVividSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVividSales.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
      })
      .addCase(getVividSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default vividSalesSlice.reducer;
