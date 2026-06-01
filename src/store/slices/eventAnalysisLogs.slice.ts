import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import eventAnalysisLogsApi from "../../apis/eventAnalysisLogs.api";
import { setSnackbar } from "./snackbar.slice";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";
import { getErrorMessage } from "../../shared/utils/error.util";

export interface EventAnalysisLogsState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  error: any | null;
}

const initialState: EventAnalysisLogsState = {
  loading: false,
  rows: { data: [], total: 0 },
  error: null,
};

export const getEventAnalysisLogs = createAsyncThunk(
  "eventAnalysisLogs/fetch",
  async (options: DataGridQueryOptions, { dispatch, rejectWithValue }) => {
    try {
      return await eventAnalysisLogsApi.fetchLogs(options);
    } catch (err: any) {
      const message = `[Analysis Logs] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  },
);

const eventAnalysisLogsSlice = createSlice({
  name: "eventAnalysisLogs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getEventAnalysisLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEventAnalysisLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
      })
      .addCase(getEventAnalysisLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default eventAnalysisLogsSlice.reducer;
