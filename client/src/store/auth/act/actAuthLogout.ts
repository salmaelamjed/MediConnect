// src/components/store/auth/act/actAuthLogout.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";

const actAuthLogout = createAsyncThunk(
  "auth/actAuthLogout",
  async (_, thunkAPI) => {
    const { rejectWithValue } = thunkAPI;
    try {
      const accessToken =localStorage.getItem("accessToken");
      const response = await axios.post<{ message: string }>(
        "http://localhost:8000/api/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      const errorMessage = isaxiosErrorHandler(error);
      return rejectWithValue(errorMessage);
    }
  }
);

export default actAuthLogout;
