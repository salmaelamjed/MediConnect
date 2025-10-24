import type { StaffEditFormData } from "@/types/staff";
import { createAsyncThunk } from "@reduxjs/toolkit";

interface UpdateStaffParams {
  id: number;
  data: StaffEditFormData;
}

export const actUpdateStaff = createAsyncThunk(
  "staff/actUpdateStaff",
  async ({ id, data }: UpdateStaffParams, thunkAPI) => {
    try {
      const token = localStorage.getItem("accessToken");

      // Préparer le body avec les données + le token
      const body = {
        ...data,
        access_token: token, // ou _token, selon ce que votre backend attend
      };

      const response = await fetch(`http://localhost:8000/api/staff/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body), // Token envoyé dans le body
      });

      if (!response.ok) {
        const error = await response.json();
        return thunkAPI.rejectWithValue(error);
      }

      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message:
          error instanceof Error ? error.message : "Une erreur est survenue",
      });
    }
  }
);
