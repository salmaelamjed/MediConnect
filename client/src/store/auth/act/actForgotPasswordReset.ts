import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";

type TForgotPasswordResetData = {
  email: string;
  password: string;
  password_confirmation: string;
};

const actForgotPasswordReset = createAsyncThunk(
  "auth/actForgotPasswordReset",
  async (
    { email, password, password_confirmation }: TForgotPasswordResetData,
    thunkAPI
  ) => {
    const { rejectWithValue } = thunkAPI;

    try {
      const response = await axios.post(
        "http://localhost:8000/api/password-reset/change-password",
        { email, password, password_confirmation }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);

export default actForgotPasswordReset;
