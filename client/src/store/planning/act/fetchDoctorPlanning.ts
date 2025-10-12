import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";

// Define interfaces based on API response structure
interface Doctor {
  id: number;
  name: string;
  speciality: string;
  license_number: string;
}

interface PlanningPeriod {
  start_date: string;
  end_date: string;
  week_number: number;
  total_days: number;
}

interface SlotReservationCabinet {
  name: string;
  address: string;
  city: string;
}

interface SlotReservation {
  id: number;
  status: string;
  reason: string;
  doctor_notes: string | null;
  is_follow_up: boolean;
  cabinet: SlotReservationCabinet | null;
}

interface SlotPatientContact {
  email: string | null;
}

interface SlotPatient {
  id: number;
  name: string;
  date_of_birth: string;
  age: number;
  gender: string;
  address: string;
  city: string;
  postal_code: string;
  contact: SlotPatientContact;
}

interface Slot {
  time: string;
  time_display: string;
  status: string;
  reservation: SlotReservation | null;
  patient: SlotPatient | null;
}

interface DayStats {
  total: number;
  available: number;
  reserved: number;
  occupancy_rate: number;
}

interface DayPlanning {
  date: string;
  day_name: string;
  day_number: number;
  is_today: boolean;
  is_weekend: boolean;
  slots: Slot[];
  stats: DayStats;
}

interface GlobalStats {
  total_slots: number;
  available_slots: number;
  reserved_slots: number;
  occupancy_rate: number;
}

interface PlanningData {
  [date: string]: DayPlanning | GlobalStats; // Dates are keys, '_stats' is global
}

export interface DoctorPlanningResponseData {
  doctor: Doctor;
  planning_period: PlanningPeriod;
  planning: PlanningData;
}

interface DoctorPlanningResponse {
  success: boolean;
  data: DoctorPlanningResponseData;
  message?: string;
  errors?: Record<string, string[]>; // Replaced 'any' with specific type
}

export const fetchDoctorPlanning = createAsyncThunk<
  DoctorPlanningResponseData,
  { start_date?: string; end_date?: string } | undefined,
  { rejectValue: string }
>("planning/fetchDoctorPlanning", async (params, { rejectWithValue }) => {
  try {
     const token = localStorage.getItem("accessToken");
    const response = await axios.get<DoctorPlanningResponse>(
      "http://localhost:8000/api/schedules",
      {
        params, // Pass start_date and end_date if provided

          headers: {
            Authorization: `Bearer ${token}`,
          },
      },
    );

    if (!response.data.success) {
      return rejectWithValue(
        response.data.message || "Failed to fetch planning"
      );
    }

    return response.data.data;
  } catch (error) {
    return rejectWithValue(isaxiosErrorHandler(error));
  }
});
