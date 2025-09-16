// specialitiesSlice.js
import { isaxiosErrorHandler } from "@/Util";
import {  createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const actGetAllActive = createAsyncThunk(
  "specialities/actGetAllActive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/specialities/active`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);
