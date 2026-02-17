import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import sgeventsApi from "../../apis/sgevents.api";
import { setSnackbar } from "./snackbar.slice";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";

export interface SGEventsState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  error: any | null;
}

const initialState: SGEventsState = {
  loading: false,
  rows: {
    data: [],
    total: 0,
  },
  error: null,
};

// Async thunk to fetch SeatGeek events
export const getSGEvents = createAsyncThunk(
  "sgevents/fetchSGEvents",
  async (
    data: DataGridQueryOptions,
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await sgeventsApi.fetchSGEvents(data);
      return response;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch SeatGeek events";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

// Async thunk to fetch a single SeatGeek event
export const getSGEvent = createAsyncThunk(
  "sgevents/fetchSGEvent",
  async (
    eventId: string,
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await sgeventsApi.fetchSGEvent(eventId);
      return response;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch SeatGeek event";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const sgeventsSlice = createSlice({
  name: "sgevents",
  initialState,
  reducers: {
    clearSGEvents: (state) => {
      state.rows.data = [];
      state.rows.total = 0;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSGEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSGEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.rows.data = action.payload.data || [];
        state.rows.total = action.payload.total || 0;
      })
      .addCase(getSGEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getSGEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSGEvent.fulfilled, (state, action) => {
        state.loading = false;
        // For single event fetch, we add it to the data array
        const event = action.payload;
        const exists = state.rows.data.some(e => e.id === event.id);
        if (!exists) {
          state.rows.data = [event, ...state.rows.data];
          state.rows.total = state.rows.total + 1;
        }
      })
      .addCase(getSGEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSGEvents } = sgeventsSlice.actions;
export default sgeventsSlice.reducer;