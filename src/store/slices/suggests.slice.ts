import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import suggestsApi, { type UpdateSuggestPayload } from "../../apis/suggests.api";
import { setSnackbar } from "./snackbar.slice";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";

export interface SuggestsState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  error: any | null;
}

const initialState: SuggestsState = {
  loading: false,
  rows: {
    data: [],
    total: 0,
  },
  error: null,
};

export const getSuggests = createAsyncThunk(
  "suggests/fetchSuggests",
  async (data: DataGridQueryOptions, { dispatch, rejectWithValue }) => {
    try {
      const response = await suggestsApi.fetchSuggests(data);
      return response;
    } catch (err: any) {
      const message = err?.message || "Failed to fetch suggests";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

export const updateSuggest = createAsyncThunk(
  "suggests/updateSuggest",
  async (
    {
      payload,
      queryOptions,
    }: { payload: UpdateSuggestPayload; queryOptions?: DataGridQueryOptions },
    { dispatch, rejectWithValue }
  ) => {
    try {
      await suggestsApi.updateSuggest(payload);
      dispatch(
        setSnackbar({ message: "Suggestion updated successfully", severity: "success" })
      );
      if (queryOptions) {
        dispatch(getSuggests(queryOptions));
      }
    } catch (err: any) {
      const message = err?.message || "Failed to update suggestion";
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const suggestsSlice = createSlice({
  name: "suggests",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSuggests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSuggests.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
      })
      .addCase(getSuggests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default suggestsSlice.reducer;
