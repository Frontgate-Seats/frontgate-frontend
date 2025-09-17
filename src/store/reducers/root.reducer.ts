import { combineReducers } from "redux";
import authReducer from "../slices/auth.slice";
import themeReducer from "../slices/theme.slice";
import snackbarReducer from "../slices/snackbar.slice";

const rootReducer = combineReducers({
  auth: authReducer,
  theme: themeReducer,
  snackbar: snackbarReducer,
});

export default rootReducer;
