import type { PatientPaginatedResponse } from "@/types/patient";
import { isaxiosErrorHandler } from "@/Util";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { ErrorResponse } from "@/types/patient";

export const actGetPatients = createAsyncThunk<
  PatientPaginatedResponse,
  { page?: number; perPage?: number; search?: string; gender?: 'Female' | 'Male' },
  { rejectValue: ErrorResponse }
>(
  'patients/actGetPatients',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get<PatientPaginatedResponse>(
        `http://localhost:8000/api/patients`,
        {
          params: {
            page: params.page,
            per_page: params.perPage,
            search: params.search,
            gender: params.gender,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);
