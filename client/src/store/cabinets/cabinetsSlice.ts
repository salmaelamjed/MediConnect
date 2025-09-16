// cabinetsSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { actGetAllCabinetsActive } from "./act/actGetAllCabinetsActive";
import type { CabinetsState } from "@/types/cabinet";
import { isString } from "@/types/guard";

const initialState: CabinetsState = {
  cabinets: [],
  loading: false,
  error: null,
};

const cabinetsSlice = createSlice({
  name: "cabinets",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(actGetAllCabinetsActive.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(actGetAllCabinetsActive.fulfilled, (state, action) => {
        state.loading = false;
        state.cabinets = action.payload.cabinets || [];
      })
      .addCase(actGetAllCabinetsActive.rejected, (state, action) => {
        state.loading = false;
        if (isString(action.payload)) {
          state.error = action.payload;
        }
        state.cabinets = [];
      });
  },
});

export const { clearError } = cabinetsSlice.actions;
export default cabinetsSlice.reducer;
