import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TLoading } from "@/types/shared";
import { actGetPatients } from "./act/actGetPatients";
import { actCreatePatient } from "./act/actCreatePatient";
import { actUpdatePatient } from "./act/actUpdatePatient";
import { actDeletePatient } from "./act/actDeletePatient";
import type {
  Patient,
  PatientPaginatedResponse,
  PatientResponse,
  ErrorResponse,
} from "@/types/patient";

// Define the state interface
interface IPatientsState {
  patients: Patient[];
  currentPatient: Patient | null;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  loading: TLoading;
  error: ErrorResponse | null;
}

// Initial state
const initialState: IPatientsState = {
  patients: [],
  currentPatient: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
  },
  loading: "idle",
  error: null,
};

// Patients Slice
const patientsSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {
    setPatient: (state, action: PayloadAction<Patient>) => {
      state.patients.unshift(action.payload); // Add new patient to the start of the array
      state.pagination.total += 1; // Increment total count
      state.pagination.to = Math.min(
        state.pagination.to + 1,
        state.pagination.total
      );
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // actGetPatients
    builder
      .addCase(actGetPatients.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        actGetPatients.fulfilled,
        (state, action: PayloadAction<PatientPaginatedResponse>) => {
          state.loading = "succeeded";
          state.patients = action.payload.data;
          state.pagination = {
            current_page: action.payload.current_page,
            last_page: action.payload.last_page,
            per_page: action.payload.per_page,
            total: action.payload.total,
            from: action.payload.from,
            to: action.payload.to,
          };
        }
      )
      .addCase(
        actGetPatients.rejected,
        (state, action: PayloadAction<ErrorResponse | undefined>) => {
          state.loading = "failed";
          state.error = action.payload || {
            success: false,
            message: "Failed to fetch patients",
          };
        }
      );

    // actCreatePatient
    builder
      .addCase(actCreatePatient.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        actCreatePatient.fulfilled,
        (state, action: PayloadAction<PatientResponse>) => {
          state.loading = "succeeded";
          state.patients.push(action.payload.data);
          state.currentPatient = action.payload.data;
        }
      )
      .addCase(
        actCreatePatient.rejected,
        (state, action: PayloadAction<ErrorResponse | undefined>) => {
          state.loading = "failed";
          state.error = action.payload || {
            success: false,
            message: "Failed to create patient",
          };
        }
      );

    // actUpdatePatient
    builder
      .addCase(actUpdatePatient.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        actUpdatePatient.fulfilled,
        (state, action: PayloadAction<PatientResponse>) => {
          state.loading = "succeeded";
          state.currentPatient = action.payload.data;
          const index = state.patients.findIndex(
            (p: Patient) => p.id === action.payload.data.id
          );
          if (index !== -1) {
            state.patients[index] = action.payload.data;
          }
        }
      )
      .addCase(
        actUpdatePatient.rejected,
        (state, action: PayloadAction<ErrorResponse | undefined>) => {
          state.loading = "failed";
          state.error = action.payload || {
            success: false,
            message: "Failed to update patient",
          };
        }
      );

    // actDeletePatient
    builder
      .addCase(actDeletePatient.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        actDeletePatient.fulfilled,
        (
          state,
          action: PayloadAction<
            { success: boolean; message: string },
            string,
            { arg: number }
          >
        ) => {
          state.loading = "succeeded";
          state.patients = state.patients.filter(
            (p: Patient) => p.id !== action.meta.arg
          );
          state.currentPatient = null;
        }
      )
      .addCase(
        actDeletePatient.rejected,
        (state, action: PayloadAction<ErrorResponse | undefined>) => {
          state.loading = "failed";
          state.error = action.payload || {
            success: false,
            message: "Failed to delete patient",
          };
        }
      );
  },
});

// Export actions
export const { clearError,setPatient } = patientsSlice.actions;

// Export reducer
export default patientsSlice.reducer;
