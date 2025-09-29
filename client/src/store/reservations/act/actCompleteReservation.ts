import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface CompleteReservationPayload {
  id: number;
  doctor_notes?: string;
}

export const actCompleteReservation = createAsyncThunk(
  "reservations/actCompleteReservation",
  async (payload: CompleteReservationPayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/reservations/${payload.id}/complete`,
        { doctor_notes: payload.doctor_notes?.trim() || "" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      return {
        id: payload.id,
        data: response.data.data,
        message: response.data.message || "Consultation completed successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          error.response.data.message || "Failed to complete reservation"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);
