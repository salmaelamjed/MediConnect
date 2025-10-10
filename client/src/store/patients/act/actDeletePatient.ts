import type { ErrorResponse } from "@/types/patient";
import { isaxiosErrorHandler } from "@/Util";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const actDeletePatient = createAsyncThunk<
  { success: boolean; message: string },
  number,
  { rejectValue: ErrorResponse }
>("patients/actDeletePatient", async (id, { rejectWithValue }) => {
  try {
    const response = await axios.delete<{ success: boolean; message: string }>(
      `http://localhost:8000/api/patients/${id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    return rejectWithValue(isaxiosErrorHandler(error));
  }
});
