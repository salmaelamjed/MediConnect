import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface UpdateReservationPayload {
  id: number;
  updates: {
    status: string;
  };
}

export const actUpdateReservation = createAsyncThunk(
  "reservations/updateReservation",
  async (payload: UpdateReservationPayload, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `http://localhost:8000/api/reservations/${payload.id}/reschedule`,
        { status: payload.updates.status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      return {
        id: payload.id,
        data: response.data.data,
        message: response.data.message || "Reservation updated successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          error.response.data.message || "Failed to update reservation"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);
