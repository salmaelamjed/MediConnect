import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const actCreateReservation = createAsyncThunk(
  "reservations/actCreateReservation",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/reservations",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`, 
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data.message || error.message);
      } else {
        return rejectWithValue("An unexpected error");
      }
    }
  }
);
