import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import dashboardApi, {
  type InventorySummary,
  type PurchasesSummary,
  type SalesSummary,
  type CombinedChartBucket,
} from "../../apis/dashboard.api";
import { setSnackbar } from "./snackbar.slice";
import { getErrorMessage } from "../../shared/utils/error.util";
import type { DataGridQueryOptions } from "../../shared/types/mui.type";
import type { DateRange, Purchase, Sale } from "../../types/dashboard.types";

// Thunk args: the date range plus the DataGrid query options (page/sort/filters).
interface GridArgs {
  dateRange: DateRange;
  options: DataGridQueryOptions;
}

export interface DashboardState {
  // Inventory summary cards
  summary: InventorySummary | null;
  summaryLoading: boolean;

  // Purchases table
  purchases: { data: Purchase[]; total: number };
  purchasesLoading: boolean;
  purchasesSummary: PurchasesSummary | null;

  // Sales table
  sales: { data: Sale[]; total: number };
  salesLoading: boolean;
  salesSummary: SalesSummary | null;

  // Combined chart
  chart: CombinedChartBucket[];
  chartLoading: boolean;

  error: string | null;
}

const initialState: DashboardState = {
  summary: null,
  summaryLoading: false,

  purchases: { data: [], total: 0 },
  purchasesLoading: false,
  purchasesSummary: null,

  sales: { data: [], total: 0 },
  salesLoading: false,
  salesSummary: null,

  chart: [],
  chartLoading: false,

  error: null,
};

// 🔹 Inventory summary (cards)
export const getInventorySummary = createAsyncThunk(
  "dashboard/getInventorySummary",
  async (_: void, { dispatch, rejectWithValue }) => {
    try {
      return await dashboardApi.getInventorySummary();
    } catch (err: any) {
      const message = `[Dashboard] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  },
);

// 🔹 Purchases table page
export const getDashboardPurchases = createAsyncThunk(
  "dashboard/getDashboardPurchases",
  async ({ dateRange, options }: GridArgs, { dispatch, rejectWithValue }) => {
    try {
      return await dashboardApi.fetchPurchases(dateRange, options);
    } catch (err: any) {
      const message = `[Dashboard Purchases] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  },
);

// 🔹 Purchases footer summary
export const getDashboardPurchasesSummary = createAsyncThunk(
  "dashboard/getDashboardPurchasesSummary",
  async ({ dateRange, options }: GridArgs, { dispatch, rejectWithValue }) => {
    try {
      return await dashboardApi.fetchPurchasesSummary(dateRange, options);
    } catch (err: any) {
      const message = `[Dashboard Purchases] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  },
);

// 🔹 Sales table page
export const getDashboardSales = createAsyncThunk(
  "dashboard/getDashboardSales",
  async ({ dateRange, options }: GridArgs, { dispatch, rejectWithValue }) => {
    try {
      return await dashboardApi.fetchSales(dateRange, options);
    } catch (err: any) {
      const message = `[Dashboard Sales] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  },
);

// 🔹 Sales footer summary
export const getDashboardSalesSummary = createAsyncThunk(
  "dashboard/getDashboardSalesSummary",
  async ({ dateRange, options }: GridArgs, { dispatch, rejectWithValue }) => {
    try {
      return await dashboardApi.fetchSalesSummary(dateRange, options);
    } catch (err: any) {
      const message = `[Dashboard Sales] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  },
);

// 🔹 Combined purchases + sales chart
export const getDashboardChart = createAsyncThunk(
  "dashboard/getDashboardChart",
  async (dateRange: DateRange, { dispatch, rejectWithValue }) => {
    try {
      return await dashboardApi.getCombinedChart(dateRange);
    } catch (err: any) {
      const message = `[Dashboard Chart] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    resetDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Inventory summary
      .addCase(getInventorySummary.pending, (state) => {
        state.summaryLoading = true;
        state.error = null;
      })
      .addCase(getInventorySummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(getInventorySummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.error = action.payload as string;
      })

      // Purchases page
      .addCase(getDashboardPurchases.pending, (state) => {
        state.purchasesLoading = true;
        state.error = null;
      })
      .addCase(getDashboardPurchases.fulfilled, (state, action) => {
        state.purchasesLoading = false;
        state.purchases = action.payload || { data: [], total: 0 };
      })
      .addCase(getDashboardPurchases.rejected, (state, action) => {
        state.purchasesLoading = false;
        state.error = action.payload as string;
      })

      // Purchases summary
      .addCase(getDashboardPurchasesSummary.fulfilled, (state, action) => {
        state.purchasesSummary = action.payload;
      })
      .addCase(getDashboardPurchasesSummary.rejected, (state) => {
        state.purchasesSummary = null;
      })

      // Sales page
      .addCase(getDashboardSales.pending, (state) => {
        state.salesLoading = true;
        state.error = null;
      })
      .addCase(getDashboardSales.fulfilled, (state, action) => {
        state.salesLoading = false;
        state.sales = action.payload || { data: [], total: 0 };
      })
      .addCase(getDashboardSales.rejected, (state, action) => {
        state.salesLoading = false;
        state.error = action.payload as string;
      })

      // Sales summary
      .addCase(getDashboardSalesSummary.fulfilled, (state, action) => {
        state.salesSummary = action.payload;
      })
      .addCase(getDashboardSalesSummary.rejected, (state) => {
        state.salesSummary = null;
      })

      // Combined chart
      .addCase(getDashboardChart.pending, (state) => {
        state.chartLoading = true;
        state.error = null;
      })
      .addCase(getDashboardChart.fulfilled, (state, action) => {
        state.chartLoading = false;
        state.chart = action.payload;
      })
      .addCase(getDashboardChart.rejected, (state, action) => {
        state.chartLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
