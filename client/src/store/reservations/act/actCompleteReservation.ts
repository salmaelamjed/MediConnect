import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const actCompleteReservation = createAsyncThunk(
  "reservations/actCompleteReservation",
  async ({ id ,doctor_notes}:{id:number,doctor_notes:string}, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `http://localhost:8000/api/reservations/${id}/complete`,
         doctor_notes,
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
