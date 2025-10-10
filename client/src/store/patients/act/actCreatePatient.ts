import type { ErrorResponse, PatientResponse } from "@/types/patient";
import { isaxiosErrorHandler } from "@/Util";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const actCreatePatient = createAsyncThunk<
  PatientResponse,
  {
    email?: string;
    password?: string;
    password_confirmation?: string;
    name?: string;
    profile?: string;
    date_of_birth: string;
    gender: "Female" | "Male";
    address: string;
    city: string;
    code_postal: string;
    medical_history?: string;
    allergies?: string;
    user_id?: number;
  },
  { rejectValue: ErrorResponse }
>("patients/actCreatePatient", async (patientData, { rejectWithValue }) => {
  try {
    const response = await axios.post<PatientResponse>(
      `http://localhost:8000/api/patients`,
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
});