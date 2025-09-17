import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ThemeMode, ThemeStateSlice } from "./types";

const initialState: ThemeStateSlice = {
  mode: (localStorage.getItem("themeMode") as ThemeMode) || "light",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleThemeMode: (state) => {
      const newTheme = state.mode === "light" ? "dark" : "light";
      state.mode = newTheme;
      localStorage.setItem("themeMode", newTheme);
    },
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      localStorage.setItem("themeMode", action.payload);
    },
  },
});

export const { toggleThemeMode, setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
