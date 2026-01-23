import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { setSnackbar } from "./snackbar.slice";
import type { SignInProps, UserStateSlice } from "./types";
import authApi from "../../apis/auth.api";
import supabaseClient from "../../clients/supabase.client";

const initialState: UserStateSlice = {
  loading: true, // Start with loading true to check initial session
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

      dispatch(
        setSnackbar({
          message: "Successfully signed in",
          severity: "success",
        }),
      );

      return {
        user: response.user,
        token: response.session?.access_token || null,
      };
    } catch (error: any) {
      console.log("ERRO : ", error);
      dispatch(
        setSnackbar({
          message: error.message || "Something went wrong",
          severity: "error",
        }),
      );
      return rejectWithValue(error);
    }
  },
);

export const signOut = createAsyncThunk(
  `${name}/auth/signOut`,
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await authApi.signOut();

      dispatch(
        setSnackbar({
          message: "Successfully signed out",
          severity: "success",
        }),
      );

      return null;
    } catch (error: any) {
      console.log("ERRO : ", error);
      dispatch(
        setSnackbar({
          message: error.message || "Something went wrong",
          severity: "error",
        }),
      );
      return rejectWithValue(error);
    }
  },
);

export const getCurrentUser = createAsyncThunk(
  `${name}/auth/getCurrentUser`,
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.getCurrentUser();
      const session = await authApi.getCurrentSession();

      return {
        user,
        token: session?.access_token || null,
      };
    } catch (error: any) {
      return rejectWithValue(error);
    }
  },
);

export const initializeAuth = createAsyncThunk(
  `${name}/auth/initialize`,
  async (_, { }) => {
    try {
      // Get initial session
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (session?.user) {
        return {
          user: session.user,
          token: session.access_token,
        };
      }

      return null;
    } catch (error) {
      console.log("Auth initialization error:", error);
      return null;
    }
  },
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
    setAuthState: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false;
      })
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
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })
      // Sign out
      .addCase(signOut.pending, (state) => {
        state.loading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.error = action.payload ?? null;
      });
  },
});

export const { logout, setAuthState } = authSlice.actions;

export default authSlice.reducer;
