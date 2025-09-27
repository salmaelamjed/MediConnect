import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";

export const actDeleteReservation = createAsyncThunk<
  { id: number; data: any }, 
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
      return { id: reservationId, data: response.data };
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);
