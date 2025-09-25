import { combineReducers } from "redux";
import authReducer from "../slices/auth.slice";
import snackbarReducer from "../slices/snackbar.slice";
import eventReducer from "../slices/event.slice";
import type { store } from "..";
import { useDispatch } from "react-redux";

const rootReducer = combineReducers({
  auth: authReducer,
  snackbar: snackbarReducer,
  event: eventReducer,
});

export type RootState = ReturnType<typeof rootReducer>; // <--- optional, for selector typing
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();

export default rootReducer;
