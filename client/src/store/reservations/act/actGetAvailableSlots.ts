import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export interface AvailableSlotsPayload {
  date: string; // YYYY-MM-DD
  cabinet_id: number;
  doctor_id: number;
}

export interface AvailableSlotsResponse {
  success: boolean;
  date: string;
  available_slots: string[];
  message?: string;
}

export const actGetAvailableSlots = createAsyncThunk(
  "reservations/actGetAvailableSlots",
  async (
    { date, cabinet_id, doctor_id }: AvailableSlotsPayload,
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/doctors/${doctor_id}/available-slots`,
        {
          params: { date, cabinet_id },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      return response.data as AvailableSlotsResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data.message || error.message);
      } else {
        return rejectWithValue("An unexpected error");
      }
    }
  }
);
