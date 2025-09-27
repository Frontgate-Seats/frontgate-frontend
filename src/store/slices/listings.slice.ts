import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import type { IListing } from "../../apis/listings.api";
import listingsApi from "../../apis/listings.api";

export interface EventsState {
  loading: boolean;
  rows: IListing[];
  total: number;
  error: string | null;
}

const initialState: EventsState = {
  loading: false,
  rows: [],
  total: 0,
  error: null,
};

// Async thunk to fetch listings
export const getListings = createAsyncThunk(
  "listings",
  async (
    { page, pageSize }: { page: number; pageSize: number },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await listingsApi.fetchListings(page, pageSize);
      return response.data;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch listings";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

//
export const getListingsByField = createAsyncThunk(
  "listings/:name/:field",
  async (
    {
      page,
      pageSize,
      field,
    }: { page: number; pageSize: number; field: { name: string; value: any } },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await listingsApi.fetchListingsByField(
        page,
        pageSize,
        field
      );
      return response.data;
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
      .addCase(getListings.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.rows = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(getListings.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      })
      .addCase(getListingsByField.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getListingsByField.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.rows = action.payload.data;
          state.total = action.payload.total;
        }
      )
      .addCase(
        getListingsByField.rejected,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.error = action.payload || "Something went wrong";
        }
      );
  },
});

export const {} = listingsSlice.actions;

export default listingsSlice.reducer;
