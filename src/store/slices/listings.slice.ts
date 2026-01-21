import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import listingsApi from "../../apis/listings.api";

export interface EventsState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  data: any;
  total: number;
  error: any;
}

const initialState: EventsState = {
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
export const getListings = createAsyncThunk(
  "listings",
  async (event_id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await listingsApi.fetchListings(event_id);
      return response;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch listings";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const listingsSlice = createSlice({
  name: "listings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getListings.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
      })
      .addCase(getListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const {} = listingsSlice.actions;

export default listingsSlice.reducer;
