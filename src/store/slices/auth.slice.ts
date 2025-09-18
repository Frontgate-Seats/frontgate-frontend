import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import type { SignInProps, UserStateSlice } from "./types";
import authApi from "../../apis/auth.api";

const initialState: UserStateSlice = {
  loading: false,
  user: null,
  token: null,
  error: null,
};

const name: string = "auth";

export const signIn = createAsyncThunk(
  `${name}/auth/signIn`,
  async (data: SignInProps, { rejectWithValue, dispatch }) => {
    try {
      const response = await authApi.signIn(data);
      if (!response.success) {
        // dispatch snackbar on error
        dispatch(
          setSnackbar({
            message: response.data.message || "Something went wrong",
            severity: "error",
          })
        );
        return rejectWithValue(response.data);
      }
      return response.data;
    } catch (error: any) {
      console.log("ERRO : ", error);
      dispatch(
        setSnackbar({
          message: error.message || "Something went wrong",
          severity: "error",
        })
      );
      return rejectWithValue(error);
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // User signIn
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(signIn.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload ?? null;
      });
  },
});

export const {
  logout
} = authSlice.actions;

export default authSlice.reducer;
