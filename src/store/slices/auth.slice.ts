import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import type { SignInProps, UserStateSlice, VerifyTokenProps } from "./types";
import authApi from "../../apis/auth.api";

const initialState: UserStateSlice = {
  loading: false,
  user: null,
  error: null,
};

const name: string = "auth";

export const signIn = createAsyncThunk(
  `${name}/auth/signIn`,
  async (data: SignInProps, { rejectWithValue }) => {
    try {
      const response = await authApi.signIn(data);
      if (response.data.code !== 200) {
        return rejectWithValue(response.data);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);


export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // User signIn
      .addCase(signIn.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = true;
        state.user = action.payload;
      })
      .addCase(signIn.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload ?? null;
        // dispatch snackbar for the error
        if (action.payload) {
          // since we are inside extraReducers, use the thunkAPI `dispatch`
          action.meta.dispatch(
            setSnackbar({
              message: action.payload.message || "Something went wrong",
              severity: "error",
            })
          );
        }
      });
  },
});

export const {
  // incrementByAmount
} = authSlice.actions;

export default authSlice.reducer;
