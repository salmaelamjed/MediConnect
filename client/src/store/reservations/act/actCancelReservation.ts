// src/store/reservations/act/actCancelReservation.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface CancelReservationPayload {
  id: number;
  cancellation_reason: string;
}

export const actCancelReservation = createAsyncThunk(
  "reservations/cancelReservation",
  async (payload: CancelReservationPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/reservations/${payload.id}/cancel`,
        {
          cancellation_reason: payload.cancellation_reason,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      return response.data; // Assuming the API returns the updated reservation
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue("Failed to cancel reservation");
    }
  }
);
