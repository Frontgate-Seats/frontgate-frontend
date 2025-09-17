import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SnackbarStateSlice } from "./types";

const initialState: SnackbarStateSlice = {
  open: false,
  duration: 3000,
  message: "",
  severity: "success",
  variant: "filled",
  anchorOrigin: { vertical: "top", horizontal: "right" },
};

const snackbarSlice = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    setSnackbar: (state, action: PayloadAction<Partial<SnackbarStateSlice>>) => {
      return { ...state, ...action.payload, open: true };
    },
    closeSnackbar: (state) => {
      state.open = false;
    },
  },
});

export const { setSnackbar, closeSnackbar } = snackbarSlice.actions;
export default snackbarSlice.reducer;
