import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import listingsApi from "../../apis/listings.api";
import { getErrorMessage } from "../../shared/utils/error.util";

// Types for map data
export interface MapZone {
  name?: string;
  description?: string;
}

export interface MapGroup {
  id: number;
  name: string;
  color?: string;
  hasTickets?: boolean;
  isActive?: boolean;
  isGrouped?: boolean;
  maxPrice?: number;
  minPrice?: number;
  quantity?: number;
  zone?: MapZone | null;
}

export interface SeatView {
  panoramaImage?: string;
  largeImage?: string;
  smallImage?: string;
}

export interface MapSection {
  id: number;
  name: string;
  groupId?: number;
  isActive?: boolean;
  maxPrice?: number;
  minPrice?: number;
  minAllPrice?: number;
  quantity?: number;
  seatView?: SeatView | null;
}

export interface VenueMapData {
  jsonMapUrl: string | null;
  staticUrl: string | null;
  patternSize?: number;
  zoomFactor?: number;
  zoomXoff?: number;
  zoomYoff?: number;
  groups: MapGroup[];
  sections: MapSection[];
}

export interface ListingItem {
  id: string | number;
  row: string;
  notes?: string;
  quantity: number;
  splits?: number[];
  price: number;
  allInPrice?: number;
  faceValue?: number | null;
  stockType?: string;
  section: { id: number; name: string };
  section_name: string;
  isZoneSeating?: boolean;
  priceBreakdown?: { price: number; serviceFee: number; total: number } | null;
}

export interface ListingsMapViewState {
  loading: boolean;
  listings: ListingItem[];
  map: VenueMapData | null;
  jsonMapUrl: string | null;
  staticUrl: string | null;
  error: string | null;
}

const initialState: ListingsMapViewState = {
  loading: false,
  listings: [],
  map: null,
  jsonMapUrl: null,
  staticUrl: null,
  error: null,
};

// Async thunk to fetch listings with map data
export const getListingsWithMap = createAsyncThunk(
  "listingsMapView/fetch",
  async (event_id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await listingsApi.fetchListingsWithMap(event_id);
      return response;
    } catch (err: any) {
      const message = `[Listings Map] ${getErrorMessage(err)}`;
      dispatch(setSnackbar({ message, severity: "error" }));
      return rejectWithValue(message);
    }
  }
);

const listingsMapViewSlice = createSlice({
  name: "listingsMapView",
  initialState,
  reducers: {
    resetListingsMapView: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getListingsWithMap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getListingsWithMap.fulfilled, (state, action) => {
        state.loading = false;
        state.listings = action.payload.listings;
        state.map = action.payload.map;
        state.jsonMapUrl = action.payload.jsonMapUrl;
        state.staticUrl = action.payload.staticUrl;
      })
      .addCase(getListingsWithMap.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Something went wrong";
      });
  },
});

export const { resetListingsMapView } = listingsMapViewSlice.actions;
export default listingsMapViewSlice.reducer;
