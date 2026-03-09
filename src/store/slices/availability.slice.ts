import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import availabilityApi from "../../apis/availability.api";
import { setSnackbar } from "./snackbar.slice";

export interface AvailabilityState {
  data: any | null;
  loading: boolean;
  error: any | null;
}

const initialState: AvailabilityState = {
  data: null,
  loading: false,
  error: null,
};

// Async thunk to fetch availability
export const getAvailability = createAsyncThunk(
  "availability/fetchAvailability",
  async (
    { eventId, lastHoursCount }: { eventId: string; lastHoursCount?: number },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await availabilityApi.fetchAvailability(
        eventId,
        lastHoursCount
      );
      
      // Transform tj-availability-info response to match expected format
      // Response structure: { success: true, message: string, data: { event, metrics } }
      if (response?.success && response?.data) {
        return {
          event_id: eventId,
          snapshots: response.data.metrics || [],
          lastHoursCount: lastHoursCount || 24,
          fetch_timestamp: new Date().toISOString(),
          pmEvent: response.data.event || null,
        };
      }
      
      return response;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch availability data";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const availabilitySlice = createSlice({
  name: "availability",
  initialState,
  reducers: {
    clearAvailability: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch availability";
      });
  },
});

export const { clearAvailability } = availabilitySlice.actions;
export default availabilitySlice.reducer;
