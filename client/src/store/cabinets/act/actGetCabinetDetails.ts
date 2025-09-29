import type { Cabinet } from "@/types/cabinet";
import { isaxiosErrorHandler } from "@/Util";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const actGetCabinetDetails = createAsyncThunk<
  Cabinet, // Return type (single Cabinet object)
  number, // Argument type (ID as number)
  { rejectValue: string } // Reject value type
>("cabinets/actGetCabinetDetails", async (id, { rejectWithValue }) => {
  try {
    const response = await axios.get(
      `http://localhost:8000/api/cabinets/${id}`
    );
    return response.data.data; // Return the single cabinet object
  } catch (error) {
    return rejectWithValue(isaxiosErrorHandler(error));
  }
});
