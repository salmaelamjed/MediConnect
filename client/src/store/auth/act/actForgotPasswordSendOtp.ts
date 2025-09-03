import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";



const actForgotPasswordSendOtp = createAsyncThunk(
  "auth/actForgotPasswordSendOtp",
  async (email: string, thunkAPI) => {
    const { rejectWithValue } = thunkAPI;

    try {
      const response = await axios.post(
        "http://localhost:8000/api/password-reset/send-code",
        { email }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);

export default actForgotPasswordSendOtp;
