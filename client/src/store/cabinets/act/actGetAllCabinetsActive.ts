// actGetAllCabinetsActive.js
import { isaxiosErrorHandler } from "@/Util";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const actGetAllCabinetsActive = createAsyncThunk(
  "cabinets/actGetAllCabinetsActive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/cabinets/active"
      );
      // Ensure cabinets is always an array
      return { cabinets: response.data.data || [] };
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);
