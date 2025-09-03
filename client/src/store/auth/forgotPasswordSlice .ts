import { createSlice } from "@reduxjs/toolkit";
import actForgotPasswordSendOtp from "./act/actForgotPasswordSendOtp";
import actForgotPasswordVerifyOtp from "./act/actForgotPasswordVerifyOtp";
import actForgotPasswordReset from "./act/actForgotPasswordReset";
import { actResendPasswordCode } from "./act/actForgotPasswordResendCode";
import { isString } from "@/types/guard";
import type { TLoading } from "@/types/shared";

interface IForgotPasswordState {
  email: string;
  otp: string;
  loading: TLoading;
  error: string | null;
  success: boolean;
  resendLoading: TLoading;
  resendError: string | null;
  resendSuccess: boolean;
  resendWaitTime: number; // Temps d'attente en secondes
  resendCooldown: number; // Timestamp jusqu'auquel le renvoi est bloqué
}

const initialState: IForgotPasswordState = {
  email: "",
  otp: "",
  loading: "idle",
  error: null,
  success: false,
  resendLoading: "idle",
  resendError: null,
  resendSuccess: false,
  resendWaitTime: 0,
  resendCooldown: 0,
};

const forgotPasswordSlice = createSlice({
  name: "forgotPassword",
  initialState,
  reducers: {
    resetForgotPasswordUI: (state) => {
      state.loading = "idle";
      state.error = null;
      state.success = false;
      state.resendLoading = "idle";
      state.resendError = null;
      state.resendSuccess = false;
      state.resendWaitTime = 0;
      state.resendCooldown = 0;
    },
    updateEmail: (state, action) => {
      state.email = action.payload;
    },
    updateOtp: (state, action) => {
      state.otp = action.payload;
    },
    resetResendState: (state) => {
      state.resendLoading = "idle";
      state.resendError = null;
      state.resendSuccess = false;
    },
    updateResendCooldown: (state, action) => {
      state.resendCooldown = action.payload;
    },
    decrementResendWaitTime: (state) => {
      if (state.resendWaitTime > 0) {
        state.resendWaitTime -= 1;
      }
    },
  },
  extraReducers: (builder) => {
    // Envoyer OTP
    builder.addCase(actForgotPasswordSendOtp.pending, (state) => {
      state.loading = "pending";
      state.error = null;
    });
    builder.addCase(actForgotPasswordSendOtp.fulfilled, (state) => {
      state.loading = "succeeded";
      state.success = true;
      // Initialiser le cooldown après l'envoi réussi
      state.resendCooldown = Date.now() + 2 * 60 * 1000; // 2 minutes en millisecondes
      state.resendWaitTime = 120; // 120 secondes (2 minutes)
    });
    builder.addCase(actForgotPasswordSendOtp.rejected, (state, action) => {
      state.loading = "failed";
      if (isString(action.payload)) {
        state.error = action.payload;
      }
    });

    // Vérifier OTP
    builder.addCase(actForgotPasswordVerifyOtp.pending, (state) => {
      state.loading = "pending";
      state.error = null;
    });
    builder.addCase(actForgotPasswordVerifyOtp.fulfilled, (state) => {
      state.loading = "succeeded";
      state.success = true;
    });
    builder.addCase(actForgotPasswordVerifyOtp.rejected, (state, action) => {
      state.loading = "failed";
      if (isString(action.payload)) {
        state.error = action.payload;
      }
    });

    // Réinitialiser le mot de passe
    builder.addCase(actForgotPasswordReset.pending, (state) => {
      state.loading = "pending";
      state.error = null;
    });
    builder.addCase(actForgotPasswordReset.fulfilled, (state) => {
      state.loading = "succeeded";
      state.success = true;
    });
    builder.addCase(actForgotPasswordReset.rejected, (state, action) => {
      state.loading = "failed";
      if (isString(action.payload)) {
        state.error = action.payload;
      }
    });

    // Renvoyer le code - RESEND CODE
    builder.addCase(actResendPasswordCode.pending, (state) => {
      state.resendLoading = "pending";
      state.resendError = null;
      state.resendSuccess = false;
    });
    builder.addCase(actResendPasswordCode.fulfilled, (state) => {
      state.resendLoading = "succeeded";
      state.resendSuccess = true;
      state.resendError = null;

      // Mettre à jour le cooldown après un renvoi réussi
      state.resendCooldown = Date.now() + 2 * 60 * 1000; // 2 minutes
      state.resendWaitTime = 120; // 120 secondes
    });
    builder.addCase(actResendPasswordCode.rejected, (state, action) => {
      state.resendLoading = "failed";

      // Gérer l'erreur de rate limiting (429)
      if (
        action.payload &&
        typeof action.payload === "object" &&
        "message" in action.payload
      ) {
        const payload = action.payload as any;
        if (payload.status === 429 && payload.wait_time) {
          state.resendError = payload.message;
          state.resendCooldown = Date.now() + payload.wait_time * 60 * 1000;
          state.resendWaitTime = payload.wait_time * 60;
        } else if (isString(action.payload)) {
          state.resendError = action.payload;
        }
      } else if (isString(action.payload)) {
        state.resendError = action.payload;
      }
    });
  },
});

export const {
  resetForgotPasswordUI,
  updateEmail,
  updateOtp,
  resetResendState,
  updateResendCooldown,
  decrementResendWaitTime,
} = forgotPasswordSlice.actions;
export default forgotPasswordSlice.reducer;
