import { createSlice } from "@reduxjs/toolkit";
import actAuthRegister from "./act/actAuthRegister";
import actAuthLogin from "./act/actAuthLogin";
import actAuthLogout from "./act/actAuthLogout";
import type { TLoading } from "@/types/shared";
import { isString } from "@/types/guard";

interface IAuthState {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  } | null;
  token: string | null;
  loading: TLoading;
  error: string | null;
}

const initialState: IAuthState = {
  user: null,
  token: null,
  loading: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetUI: (state) => {
      state.loading = "idle";
      state.error = null;
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("accessToken");
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(actAuthRegister.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(actAuthRegister.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.user = action.payload.user;
        // No accessToken is set during registration
      })
      .addCase(actAuthRegister.rejected, (state, action) => {
        state.loading = "failed";
        if (isString(action.payload)) {
          state.error = action.payload;
        }
      });

    // Login
    builder
      .addCase(actAuthLogin.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(actAuthLogin.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem("accessToken", action.payload.token);
      })
      .addCase(actAuthLogin.rejected, (state, action) => {
        state.loading = "failed";
        if (isString(action.payload)) {
          state.error = action.payload;
        }
      });

    // Logout
    builder
      .addCase(actAuthLogout.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(actAuthLogout.fulfilled, (state) => {
        state.loading = "succeeded";
        state.user = null;
        state.token = null;
        localStorage.removeItem("accessToken");
      })
      .addCase(actAuthLogout.rejected, (state, action) => {
        state.loading = "failed";
        if (isString(action.payload)) {
          state.error = action.payload;
        }
        // Clear state anyway to ensure logout
        state.user = null;
        state.token = null;
        localStorage.removeItem("accessToken");
      });
      
  },
});

export const { resetUI, logoutUser } = authSlice.actions;
export { actAuthRegister, actAuthLogin, actAuthLogout };
export default authSlice.reducer;
