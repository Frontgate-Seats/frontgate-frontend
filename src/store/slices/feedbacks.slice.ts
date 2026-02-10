import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import feedbacksApi, {
  type CreateFeedbackPayload,
  type UpdateFeedbackPayload,
} from "../../apis/feedbacks.api";
import { setSnackbar } from "./snackbar.slice";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";

export interface FeedbacksState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  error: any | null;
}

const initialState: FeedbacksState = {
  loading: false,
  rows: {
    data: [],
    total: 0,
  },
  error: null,
};

// Async thunk to fetch all feedbacks
export const getFeedbacks = createAsyncThunk(
  "feedbacks/fetchFeedbacks",
  async (data: DataGridQueryOptions, { dispatch, rejectWithValue }) => {
    try {
      const response = await feedbacksApi.fetchFeedbacks(data);
      return response;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch feedbacks";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

// Async thunk to create a feedback
export const createFeedback = createAsyncThunk(
  "feedbacks/createFeedback",
  async (
    {
      payload,
      queryOptions,
    }: { payload: CreateFeedbackPayload; queryOptions?: DataGridQueryOptions },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await feedbacksApi.createFeedback(payload);
      dispatch(
        setSnackbar({ message: "Feedback created successfully", severity: "success" })
      );
      // Refetch feedbacks to get updated data
      if (queryOptions) {
        dispatch(getFeedbacks(queryOptions));
      }
    } catch (err: any) {
      const message = err?.message || "Failed to create feedback";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

// Async thunk to update a feedback
export const updateFeedback = createAsyncThunk(
  "feedbacks/updateFeedback",
  async (
    {
      payload,
      queryOptions,
    }: { payload: UpdateFeedbackPayload; queryOptions?: DataGridQueryOptions },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await feedbacksApi.updateFeedback(payload);
      dispatch(
        setSnackbar({ message: "Feedback updated successfully", severity: "success" })
      );
      // Refetch feedbacks to get updated data
      if (queryOptions) {
        dispatch(getFeedbacks(queryOptions));
      }
    } catch (err: any) {
      const message = err?.message || "Failed to update feedback";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

// Async thunk to delete a feedback
export const deleteFeedback = createAsyncThunk(
  "feedbacks/deleteFeedback",
  async (
    {
      id,
      queryOptions,
    }: { id: string; queryOptions?: DataGridQueryOptions },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await feedbacksApi.deleteFeedback(id);
      dispatch(
        setSnackbar({ message: "Feedback deleted successfully", severity: "success" })
      );
      // Refetch feedbacks to get updated data
      if (queryOptions) {
        dispatch(getFeedbacks(queryOptions));
      }
    } catch (err: any) {
      const message = err?.message || "Failed to delete feedback";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const feedbacksSlice = createSlice({
  name: "feedbacks",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all feedbacks
      .addCase(getFeedbacks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFeedbacks.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
      })
      .addCase(getFeedbacks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default feedbacksSlice.reducer;
