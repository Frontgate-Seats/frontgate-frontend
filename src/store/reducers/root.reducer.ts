import { combineReducers } from "redux";
import authReducer from "../slices/auth.slice";
import snackbarReducer from "../slices/snackbar.slice";
import eventsReducer from "../slices/events.slice";
import sgeventsReducer from "../slices/sgevents.slice";
import eventsExternalMappingsReducer from "../slices/eventsExternalMappings.slice";
import suggestsReducer from "../slices/suggests.slice";
import listingsReducer from "../slices/listings.slice";
import salesReducer from "../slices/sales.slice";
import salesMetaReducer from "../slices/salesMeta.slice";
import purchasedReducer from "../slices/purchases.slice";
import listingsDetailsReducer from "../slices/listingsDetails.slice";
import chartsReducer from "../slices/charts.slice";
import listingTrendsReducer from "../slices/listingTrends.slice";
import availabilityReducer from "../slices/availability.slice";
import vividSalesReducer from "../slices/vividSales.slice";
import tradesReducer from "../slices/trades.slice";
import eventAnalysisLogsReducer from "../slices/eventAnalysisLogs.slice";

import type { store } from "..";
import { useDispatch } from "react-redux";

const rootReducer = combineReducers({
  auth: authReducer,
  snackbar: snackbarReducer,
  events: eventsReducer,
  sgevents: sgeventsReducer,
  eventsExternalMappings: eventsExternalMappingsReducer,
  suggests: suggestsReducer,
  listings: listingsReducer,
  sales: salesReducer,
  vividSales: vividSalesReducer,
  salesMeta: salesMetaReducer,
  purchases: purchasedReducer,
  listingsDetails:  listingsDetailsReducer,
  charts:  chartsReducer,
  listingTrends: listingTrendsReducer,
  availability: availabilityReducer,
  trades: tradesReducer,
  eventAnalysisLogs: eventAnalysisLogsReducer,
});

export type RootState = ReturnType<typeof rootReducer>; // <--- optional, for selector typing
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();

export default rootReducer;
