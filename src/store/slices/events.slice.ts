import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import eventsApi from "../../apis/events.api";
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

// Async thunk to fetch events
export const getEvents = createAsyncThunk(
  "events",
  async (
    data: DataGridQueryOptions,
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await eventsApi.fetchEvents(data);
      return response.data;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch events";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload.data;
      })
      .addCase(getEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default eventsSlice.reducer;
