import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { Reservation } from "@/types/reservation";

export const actDeleteReservation = createAsyncThunk<
  { id: number; data: Reservation; message: string }, // Return type
  number, // Argument type
  { rejectValue: string } // Reject value type
>(
  "reservations/actDeleteReservation",
  async (reservationId: number, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/reservations/${reservationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      return {
        id: reservationId,
        data: response.data.data,
        message: response.data.message || "Reservation deleted successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          error.response.data.message || "Failed to delete reservation"
        );
      }
      return rejectWithValue("An unexpected error occurred");
    }
  }
);
