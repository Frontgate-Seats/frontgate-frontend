import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import stubhubEventsApi from "../../apis/stubhubEvents.api";
import { getErrorMessage } from "../../shared/utils/error.util";

export interface StubhubEventsState {
  loading: boolean;
  data: any | null;
  error: any;
}

const initialState: StubhubEventsState = {
  loading: false,
  data: null,
  error: null,
};

// Async thunk to fetch a StubHub event by its ID
export const getStubhubEvent = createAsyncThunk(
  "stubhubEvents/fetchStubhubEvent",
  async (stubhubEventId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await stubhubEventsApi.fetchStubhubEvent(stubhubEventId);
      return response;
    } catch (err: any) {
      const message = `[StubHub Event] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const stubhubEventsSlice = createSlice({
  name: "stubhubEvents",
  initialState,
  reducers: {
    clearStubhubEvent: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStubhubEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStubhubEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getStubhubEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { clearStubhubEvent } = stubhubEventsSlice.actions;
export default stubhubEventsSlice.reducer;
