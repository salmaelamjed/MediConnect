import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";

type TResendFormData = {
  email: string;
};

type TResendResponse = {
  message: string;
  expires_in_minutes?: number;
};

type TResendErrorResponse = {
  message: string;
  wait_time?: number;
  status?: number;
};

export const actResendPasswordCode = createAsyncThunk(
  "auth/actResendPasswordCode",
  async (formData: TResendFormData, { rejectWithValue }) => {
    try {
      const res = await axios.post<TResendResponse>(
        "http://localhost:8000/api/password-reset/resend-code",
        formData
      );
      return res.data;
    } catch (error: any) {
      // Gérer spécifiquement l'erreur 429 (Too Many Requests)
      if (error.response?.status === 429) {
        const errorData: TResendErrorResponse = error.response.data;
        return rejectWithValue({
          message: errorData.message,
          wait_time: errorData.wait_time,
          status: 429,
        });
      }
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);
