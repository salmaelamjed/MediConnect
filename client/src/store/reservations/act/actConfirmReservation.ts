import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const actConfirmReservation = createAsyncThunk(
  "reservations/actConfirmReservation",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/reservations/${id}/confirm`,
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      return {
        id,
        data: response.data.data,
        message: response.data.message || "Reservation confirmed successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          error.response.data.message || "Failed to confirm reservation"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);
