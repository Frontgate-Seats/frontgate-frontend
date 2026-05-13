// client/src/store/slices/charts.slice.ts
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import chartsApi from "../../apis/charts.api";
import { getErrorMessage } from "../../shared/utils/error.util";
import { setSnackbar } from "./snackbar.slice";

export const fetchTopEvents = createAsyncThunk(
  "charts/fetchTopEvents",
  async (
    params: {
      from: string;
      to?: string;
      field: string;
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await chartsApi.fetchTopEvents(params);
      return response.data.data;
    } catch (error: any) {
      const message = `[Charts] ${getErrorMessage(error)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

type ChartsState = {
  field: string;
  data: any[];
  loading: boolean;
  error: string | null;
};

const initialState: ChartsState = {
  field: "getInPriceMedian",
  data: [],
  loading: false,
  error: null,
};

const chartsSlice = createSlice({
  name: "charts",
  initialState,
  reducers: {
    setField: (state, action: PayloadAction<string>) => {
      state.field = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTopEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setField } = chartsSlice.actions;
export default chartsSlice.reducer;
