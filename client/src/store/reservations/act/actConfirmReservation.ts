import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const actConfirmReservation = createAsyncThunk(
  "reservations/actConfirmReservation",
  async (id: number, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");

      const response = await axios.post(
        `http://localhost:8000/api/reservations/${id}/confirm`,
        null, // Body vide puisque c'est une confirmation
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
