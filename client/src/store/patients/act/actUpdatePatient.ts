import type { ErrorResponse, PatientResponse } from "@/types/patient";
import { isaxiosErrorHandler } from "@/Util";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const actUpdatePatient = createAsyncThunk<
  PatientResponse,
  {
    id: number;
    email?: string;
    password?: string;
    password_confirmation?: string;
    name?: string;
    profile?: string;
    date_of_birth?: string;
    gender?: "Female" | "Male";
    address?: string;
    city?: string;
    code_postal?: string;
    medical_history?: string;
    allergies?: string;
  },
  { rejectValue: ErrorResponse }
>(
  "patients/actUpdatePatient",
  async ({ id, ...patientData }, { rejectWithValue }) => {
    try {
      const response = await axios.put<PatientResponse>(
        `http://localhost:8000/api/patients/${id}`,
        patientData,
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
  }
);