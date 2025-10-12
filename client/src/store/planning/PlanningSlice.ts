import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchDoctorPlanning,
  type DoctorPlanningResponseData,
} from "./act/fetchDoctorPlanning";
import type { TLoading } from "@/types/shared";

interface IPlanningState {
  plannings: DoctorPlanningResponseData | null; // Changed from array to single object or null
  loading: TLoading;
  error: string | null;
}

const initialState: IPlanningState = {
  plannings: null,
  loading: "idle",
  error: null,
};

const planningSlice = createSlice({
  name: "plannings",
  initialState,
  reducers: {
    resetPlanning: (state) => {
      state.loading = "idle";
      state.error = null;
      state.plannings = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctorPlanning.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchDoctorPlanning.fulfilled,
        (state, action: PayloadAction<DoctorPlanningResponseData>) => {
          state.loading = "succeeded";
          state.plannings = action.payload; // Store single planning object
        }
      )
      .addCase(
        fetchDoctorPlanning.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = "failed";
          state.error = action.payload || "Unknown error";
        }
      );
  },
});

// Export actions
export const { resetPlanning } = planningSlice.actions;

// Export reducer
export default planningSlice.reducer;
