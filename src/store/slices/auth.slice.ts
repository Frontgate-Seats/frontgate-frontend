import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import type { PayloadAction } from "@reduxjs/toolkit";
// import { SignUpProps } from "../../Types/redux/services/SignUpProps";
import type { SignInProps, UserStateSlice, VerifyTokenProps } from "./types";
import authApi from "../../apis/auth.api";

const initialState: UserStateSlice = {
  isLoading: false,
  user: null,
  error: null,
};

const name: string = "auth";

export const SignIn = createAsyncThunk(
  `${name}/auth/signIn`,
  async (data: SignInProps, { rejectWithValue }) => {
    try {
      const response = await authApi.SignIn(data);
      if (response.data.code !== 200) {
        return rejectWithValue(response.data);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

// export const SignUp = createAsyncThunk(
//   `${name}/auth/signUp`,
//   async (data: SignUpProps, { rejectWithValue }) => {
//     try {
//       const response = await authApi.SignUp(data);
//       if (response.data.code !== 200) {
//         return rejectWithValue(response.data);
//       }
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error);
//     }
//   }
// );

export const VerifyToken = createAsyncThunk(
  `${name}/auth/verifyToken `,
  async (data: VerifyTokenProps, { rejectWithValue }) => {
    try {
      const response = await authApi.VerifyToken(data);
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
  reducers: {
    // incrementByAmount: (state, action: PayloadAction<number>) => {
    //     //   state.value += action.payload
    // },
  },
  extraReducers: (builder) => {
    builder
      // User SignUp
      // .addCase(SignUp.pending, (state) => {
      //   state.isLoading = true;
      //   state.error = null;
      // })
      // .addCase(SignUp.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.user = action.payload;
      // })
      // .addCase(SignUp.rejected, (state, action: any) => {
      //   state.isLoading = false;
      //   state.error = action.payload ?? null;
      // })

      // User SignIn
      .addCase(SignIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(SignIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(SignIn.rejected, (state, action: any) => {
        state.isLoading = false;
        state.error = action.payload ?? null;
      });
  },
});

export const {
  // incrementByAmount
} = authSlice.actions;

export default authSlice.reducer;
