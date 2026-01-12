import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import eventsExternalMappingsApi from "../../apis/eventsExternalMappings.api";
import { setSnackbar } from "./snackbar.slice";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";

export interface EventsState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  error: any | null;
}

const initialState: EventsState = {
  loading: false,
  rows: {
    data: [],
    total: 0,
  },
  error: null,
};

// Async thunk to fetch eventExternalMapping
export const getEventsExternalMappings = createAsyncThunk(
  "eventExternalMapping/fetchEventsExternalMappings",
  async (
    data: DataGridQueryOptions,
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await eventsExternalMappingsApi.fetchEventsExternalMappings(data);
      return response;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch eventExternalMapping";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const eventsSlice = createSlice({
  name: "eventExternalMapping",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getEventsExternalMappings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEventsExternalMappings.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
      })
      .addCase(getEventsExternalMappings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default eventsSlice.reducer;
