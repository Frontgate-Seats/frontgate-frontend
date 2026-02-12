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
  "events/fetchEvents",
  async (
    data: DataGridQueryOptions,
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await eventsApi.fetchEvents(data);
      return response;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch events";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

// Async thunk to start monitoring
export const startEventMonitoring = createAsyncThunk(
  "events/startMonitoring",
  async (
    { eventId, monitorLevel, queryOptions }: { eventId: string; monitorLevel?: string; queryOptions?: DataGridQueryOptions },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await eventsApi.startMonitoring(eventId, monitorLevel);
      dispatch(setSnackbar({ message: "Monitoring started successfully", severity: "success" }));
      // Refetch events to get updated data
      if (queryOptions) {
        dispatch(getEvents(queryOptions));
      }
    } catch (err: any) {
      const message = err?.message || "Failed to start monitoring";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

// Async thunk to stop monitoring
export const stopEventMonitoring = createAsyncThunk(
  "events/stopMonitoring",
  async (
    { eventId, queryOptions }: { eventId: string; queryOptions?: DataGridQueryOptions },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await eventsApi.stopMonitoring(eventId);
      dispatch(setSnackbar({ message: "Monitoring stopped successfully", severity: "success" }));
      // Refetch events to get updated data
      if (queryOptions) {
        dispatch(getEvents(queryOptions));
      }
    } catch (err: any) {
      const message = err?.message || "Failed to stop monitoring";
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
        state.rows = action.payload;
      })
      .addCase(getEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default eventsSlice.reducer;
