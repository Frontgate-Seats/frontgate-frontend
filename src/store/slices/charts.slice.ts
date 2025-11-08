// client/src/store/slices/charts.slice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import chartsApi from "../../apis/charts.api";

export const fetchTopEvents = createAsyncThunk(
  "charts/fetchTopEvents",
  async (
    params: {
      from: string;
      to: string;
      field: string;
      limit?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await chartsApi.fetchTopEvents(params);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch top events");
    }
  }
);

type ChartsState = {
  field: string;
  limit: number;
  data: any[];
  loading: boolean;
  error: string | null;
};

const initialState: ChartsState = {
  field: "getInPriceMedian",
  limit: 10,
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
    setLimit: (state, action: PayloadAction<number>) => {
      state.limit = action.payload;
    },
    setData: (state, action: PayloadAction<any[]>) => {
      state.data = action.payload;
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

export const { setField, setLimit, setData } = chartsSlice.actions;
export default chartsSlice.reducer;
