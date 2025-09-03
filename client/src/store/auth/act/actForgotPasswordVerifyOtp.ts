import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";

type TForgotPasswordVerifyOtpData = {
  email: string;
  code: string;
};

const actForgotPasswordVerifyOtp = createAsyncThunk(
  "auth/actForgotPasswordVerifyOtp",
  async ({ email, code }: TForgotPasswordVerifyOtpData, thunkAPI) => {
    const { rejectWithValue } = thunkAPI;

    try {
      const response = await axios.post(
        "http://localhost:8000/api/password-reset/validate-code",
        { email, code }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);

export default actForgotPasswordVerifyOtp;
