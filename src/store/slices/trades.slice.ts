import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import tradesApi from "../../apis/trades.api";
import type { Trade, LlmResultComment } from "../../shared/types/trade.types";
import { setSnackbar } from "./snackbar.slice";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";
import { getErrorMessage } from "../../shared/utils/error.util";

export interface TradesState {
  loading: boolean;
  rows: {
    data: Trade[];
    total: number;
  };
  error: string | null;
}

const initialState: TradesState = {
  loading: false,
  rows: { data: [], total: 0 },
  error: null,
};

export const getTrades = createAsyncThunk(
  "trades/fetchTrades",
  async (data: DataGridQueryOptions, { dispatch, rejectWithValue }) => {
    try {
      const response = await tradesApi.fetchTrades(data);
      return response;
    } catch (err: any) {
      const message = `[Trades] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

export const updateTradeComment = createAsyncThunk(
  "trades/updateTradeComment",
  async (
    { tradeId, comment }: { tradeId: number | string; comment: LlmResultComment },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const result = await tradesApi.updateTradeComment(tradeId, comment);
      dispatch(setSnackbar({ message: "Comment saved successfully.", severity: "success" }));
      return { tradeId, llm_result_comment: result.llm_result_comment };
    } catch (err: any) {
      const message = `[Trades] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const tradesSlice = createSlice({
  name: "trades",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getTrades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTrades.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
      })
      .addCase(getTrades.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Something went wrong";
      })
      // ── updateTradeComment — patch comment in local rows ────────────────
      .addCase(updateTradeComment.fulfilled, (state, action) => {
        const idx = state.rows.data.findIndex((r) => r.id === action.payload.tradeId);
        if (idx !== -1) {
          state.rows.data[idx] = {
            ...state.rows.data[idx],
            llm_result_comment: action.payload.llm_result_comment,
          };
        }
      });
  },
});

export default tradesSlice.reducer;
