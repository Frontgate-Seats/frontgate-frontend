import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";
import salesMetaApi from "../../apis/salesMeta.api";
import { getErrorMessage } from "../../shared/utils/error.util";


export interface salesMetaState {
  loading: boolean;
  rows: {
    data: any[];
    total: number;
  };
  total: number;
  error: any;
}

const initialState: salesMetaState = {
  loading: false,
  rows: {
    data: [],
    total: 0,
  },
  total: 0,
  error: null,
};

// Async thunk to fetch listings
export const getSalesMeta = createAsyncThunk(
  "salesMeta",
  async (data: DataGridQueryOptions, { dispatch, rejectWithValue }) => {
    try {
      const response = await salesMetaApi.fetchSalesMeta(data);
      return response.data;
    } catch (err: any) {
      const message = `[Sales Meta] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const salesSlice = createSlice({
  name: "salesMeta",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSalesMeta.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSalesMeta.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload.data;
      })
      .addCase(getSalesMeta.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const {} = salesSlice.actions;

export default salesSlice.reducer;
