import { createSlice } from "@reduxjs/toolkit";
import { isString } from "@/types/guard";
import type { TLoading } from "@/types/shared";
import { actGetAllActive } from "./act/actGetAllActive";

interface ISpeciality {
  id: number;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ISpecialitiesState {
  records: ISpeciality[];
  loading: TLoading;
  error: string | null;
  success: boolean;
}

const initialState: ISpecialitiesState = {
  records: [],
  loading: "idle",
  error: null,
  success: false,
};

const specialitiesSlice = createSlice({
  name: "specialities",
  initialState,
  reducers: {
    resetSpecialities: (state) => {
      state.records = [];
      state.loading = "idle";
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(actGetAllActive.pending, (state) => {
      state.loading = "pending";
      state.error = null;
      state.success = false;
    });
    builder.addCase(actGetAllActive.fulfilled, (state, action) => {
      state.loading = "succeeded";
      state.records = Array.isArray(action.payload)
        ? action.payload
        : action.payload.data || [];

      state.success = true;
      state.error = null;
    });
    builder.addCase(actGetAllActive.rejected, (state, action) => {
      state.loading = "failed";
      state.success = false;
      state.error = isString(action.payload)
        ? action.payload
        : "An error occurred while fetching specialties.";
    });
  },
});

export const { resetSpecialities } = specialitiesSlice.actions;
export default specialitiesSlice.reducer;
