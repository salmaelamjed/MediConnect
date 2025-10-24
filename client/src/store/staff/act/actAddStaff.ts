import type { StaffFormData } from "@/types/staff";
import { createAsyncThunk } from "@reduxjs/toolkit";

interface CreateStaffParams {
  cabinetId: number;
  data: StaffFormData;
}

export const actCreateStaff = createAsyncThunk(
  "staff/actCreateStaff",
  async ({ cabinetId, data }: CreateStaffParams, thunkAPI) => {
    try {
      const token = localStorage.getItem("accessToken");

      const body = {
        ...data
    };

      const response = await fetch(
        `http://localhost:8000/api/cabinets/${cabinetId}/staff`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body), // Token envoyé dans le body
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Erreur serveur",
          status: response.status,
        }));
        return thunkAPI.rejectWithValue(errorData);
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
