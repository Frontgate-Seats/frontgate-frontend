import { combineReducers } from "redux";
import authReducer from "../slices/auth.slice";
import snackbarReducer from "../slices/snackbar.slice";

const rootReducer = combineReducers({
  auth: authReducer,
  snackbar: snackbarReducer,
});

export default rootReducer;
