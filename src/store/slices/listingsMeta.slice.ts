import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";
import listingsMetaApi from "../../apis/listingsMeta.api";

export interface EventsState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  total: number;
  error: any;
}

const initialState: EventsState = {
  loading: false,
  rows: {
    data: [],
    total: 0,
  },
  total: 0,
  error: null,
};

// Async thunk to fetch listings
export const getListingsMeta = createAsyncThunk(
  "listingsMeta",
  async (data: DataGridQueryOptions, { dispatch, rejectWithValue }) => {
    try {
      const response = await listingsMetaApi.fetchListingsMeta(data);
      return response.data;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch listingsMeta";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const listingsMetaSlice = createSlice({
  name: "listingsMeta",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getListingsMeta.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getListingsMeta.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload.data;
      })
      .addCase(getListingsMeta.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const {} = listingsMetaSlice.actions;

export default listingsMetaSlice.reducer;
