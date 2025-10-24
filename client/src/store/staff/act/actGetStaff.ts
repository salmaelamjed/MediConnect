import { normalizeWorkingDays, type Staff } from "@/types/staff";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface GetStaffParams {
  page?: number;
  search?: string;
  cabinet_id?: number;
  job_title?: string;
  is_active?: boolean;
}

export const actGetStaff = createAsyncThunk(
  "staff/actGetStaff",
  async (params: GetStaffParams, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.search) queryParams.append("search", params.search);
      if (params.cabinet_id)
        queryParams.append("cabinet_id", params.cabinet_id.toString());
      if (params.job_title) queryParams.append("job_title", params.job_title);
      if (params.is_active !== undefined)
        queryParams.append("is_active", params.is_active ? "1" : "0");

      const token = localStorage.getItem("accessToken");
      if (!token) {
        return thunkAPI.rejectWithValue({
          message: "Token d'authentification manquant",
          error: "AuthenticationException",
        });
      }

      const response = await axios.get(
        `http://localhost:8000/api/staff?${queryParams.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      data.data = data.data.map((staff: Staff) => ({
        ...staff,
        working_days: normalizeWorkingDays(staff.working_days),
      }));

      return data;
    } catch (error: any) {
      if (error.response) {
        const errorData = error.response.data;
        return thunkAPI.rejectWithValue(
          errorData || { message: `Erreur serveur: ${error.response.status}` }
        );
      } else if (error.request) {
        return thunkAPI.rejectWithValue({
          message: "Aucune réponse du serveur",
        });
      } else {
        return thunkAPI.rejectWithValue({
          message: error.message || "Une erreur est survenue",
        });
      }
    }
  }
);