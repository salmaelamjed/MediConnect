import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { Reservation } from "@/types/reservation";
import { isaxiosErrorHandler } from "@/Util";

export const actUpdateReservation = createAsyncThunk(
  "reservations/actUpdateReservation",
  async (
    { id, updates }: { id: number; updates: Partial<Reservation> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `http://localhost:8000/api/reservations/${id}/reschedule`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      return { id, data: response.data };
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);
