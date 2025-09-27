import { isaxiosErrorHandler } from "@/Util";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const actGetReservations = createAsyncThunk(
  "reservations/actGetReservations",
  async (page: number = 1, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        `http://localhost:8000/api/reservations?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);
