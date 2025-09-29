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
      if (!payload.cancellation_reason.trim()) {
        return rejectWithValue("Cancellation reason is required");
      }
      const response = await axios.post(
        `http://localhost:8000/api/reservations/${payload.id}/cancel`,
        {
          cancellation_reason: payload.cancellation_reason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      return {
        id: payload.id,
        data: response.data.data,
        message: response.data.message || "Reservation cancelled successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          error.response.data.message || "Failed to cancel reservation"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);
