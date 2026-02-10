import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import listingTrendsApi from "../../apis/listingTrends.api";

export interface ListingTrendsState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  error: any;
}

const initialState: ListingTrendsState = {
  loading: false,
  rows: {
    data: [],
    total: 0,
  },
  error: null,
};

export const getListingTrends = createAsyncThunk(
  "listingTrends/fetchListingTrends",
  async (event_id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await listingTrendsApi.fetchListingTrends(event_id);
      return response;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch listing trends";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const listingTrendsSlice = createSlice({
  name: "listingTrends",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getListingTrends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getListingTrends.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
      })
      .addCase(getListingTrends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const {} = listingTrendsSlice.actions;

export default listingTrendsSlice.reducer;
