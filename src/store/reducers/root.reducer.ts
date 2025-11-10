import { combineReducers } from "redux";
import authReducer from "../slices/auth.slice";
import snackbarReducer from "../slices/snackbar.slice";
import eventsReducer from "../slices/events.slice";
import listingsReducer from "../slices/listings.slice";
import listingsMetaReducer from "../slices/listingsMeta.slice";
import purchasedReducer from "../slices/purchases.slice";
import listingsDetailsReducer from "../slices/listingsDetails.slice";
import chartsReducer from "../slices/charts.slice";

import type { store } from "..";
import { useDispatch } from "react-redux";

const rootReducer = combineReducers({
  auth: authReducer,
  snackbar: snackbarReducer,
  events: eventsReducer,
  listings: listingsReducer,
  listingsMeta: listingsMetaReducer,
  purchases: purchasedReducer,
  listingsDetails:  listingsDetailsReducer,
  charts:  chartsReducer
});

export type RootState = ReturnType<typeof rootReducer>; // <--- optional, for selector typing
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();

export default rootReducer;
