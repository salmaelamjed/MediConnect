import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";
import type { TFormInputs } from "@/validations/RgisterSchema";

const actAuthRegister = createAsyncThunk(
  "auth/actAuthRegister",
  async (formData: TFormInputs, thunkAPI) => {
    const { rejectWithValue } = thunkAPI;

    try {
      const response = await axios.post(
        `http://localhost:8000/api/register`,
        formData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);

export default actAuthRegister;
