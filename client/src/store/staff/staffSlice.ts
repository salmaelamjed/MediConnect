import { createSlice } from "@reduxjs/toolkit";

import type { Staff } from "@/types/staff";
import { actGetStaff } from "./act/actGetStaff";
import { actCreateStaff } from "./act/actAddStaff";
import { actUpdateStaff } from "./act/actUpdateStaff";
import { actDeleteStaff } from "./act/actDeleteStaff";

interface StaffState {
  staff: Staff[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: { message: string } | null;
}

const initialState: StaffState = {
  staff: [],
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 1,
    to: 0,
  },
  loading: "idle",
  error: null,
};

const staffSlice = createSlice({
  name: "staff",
  initialState,
  reducers: {
    setStaff: (state, action) => {
      // Update a single staff member or add new
      const index = state.staff.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.staff[index] = action.payload;
      } else {
        state.staff.push(action.payload);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(actGetStaff.pending, (state) => {
        state.loading = "pending";
      })
      .addCase(actGetStaff.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.staff = action.payload.data;
        state.pagination = {
          current_page: action.payload.current_page,
          last_page: action.payload.last_page,
          per_page: action.payload.per_page,
          total: action.payload.total,
          from: action.payload.from,
          to: action.payload.to,
        };
      })
      .addCase(actGetStaff.rejected, (state, action) => {
        state.loading = "failed";
        state.error = { message: action.payload as string };
      })
      .addCase(actCreateStaff.pending, (state) => {
        state.loading = "pending";
      })
      .addCase(actCreateStaff.fulfilled, (state, action) => {
        state.loading = "succeeded";
        // Add the new staff from action.payload.data.staff or adjust based on response
        state.staff.push(action.payload.data.staff);
      })
      .addCase(actCreateStaff.rejected, (state, action) => {
        state.loading = "failed";
        state.error = { message: action.payload as string };
      })
      .addCase(actUpdateStaff.pending, (state) => {
        state.loading = "pending";
      })
      .addCase(actUpdateStaff.fulfilled, (state, action) => {
        state.loading = "succeeded";
        const index = state.staff.findIndex(
          (s) => s.id === action.payload.data.id
        );
        if (index !== -1) {
          state.staff[index] = action.payload.data;
        }
      })
      .addCase(actUpdateStaff.rejected, (state, action) => {
        state.loading = "failed";
        state.error = { message: action.payload as string };
      })
      .addCase(actDeleteStaff.pending, (state) => {
        state.loading = "pending";
      })
      .addCase(actDeleteStaff.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.staff = state.staff.filter((s) => s.id !== action.payload);
      })
      .addCase(actDeleteStaff.rejected, (state, action) => {
        state.loading = "failed";
        state.error = { message: action.payload as string };
      });
  },
});

export const { setStaff, clearError } = staffSlice.actions;

export default staffSlice.reducer;
