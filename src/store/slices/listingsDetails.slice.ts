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
export const getSingleListingsDetails = createAsyncThunk(
  "listingsDetais",
  async (
    data: {
      listingDBId: string;
      listingId: string;
      quantity: number;
      shippingCountry?: string;
      exclusiveListings?: boolean;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await listingsApi.fetchListingsDetails(data);
      return response.data;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch listings";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const listingsDetailesSlice = createSlice({
  name: "listings",
  initialState,
  reducers: {
    resetListingDetails: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSingleListingsDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSingleListingsDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(getSingleListingsDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { resetListingDetails } = listingsDetailesSlice.actions;

export default listingsDetailesSlice.reducer;
