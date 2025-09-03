import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";

type TVerificationFormData = {
  email: string;
  code: string;
};

type TResendFormData = {
  email: string;
};

type TVerificationResponse = {
  message: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
};

type TResendResponse = {
  message: string;
};

// Thunk for email verification
export const actEmailVerification = createAsyncThunk(
  "auth/actEmailVerification",
  async (formData: TVerificationFormData, { rejectWithValue }) => {
    try {
      const res = await axios.post<TVerificationResponse>(
        "http://localhost:8000/api/verify-email",
        formData
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);

// Thunk for resending verification code
export const actResendVerificationCode = createAsyncThunk(
  "auth/actResendVerificationCode",
  async (formData: TResendFormData, { rejectWithValue }) => {
    try {
      const res = await axios.post<TResendResponse>(
        "http://localhost:8000/api/resend-verification",
        formData
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);
