import { createSlice } from "@reduxjs/toolkit";
import { actGetAllCabinetsActive } from "./act/actGetAllCabinetsActive";
import { actSearch } from "./act/actSearch";
import type { Cabinet } from "@/types/cabinet";
import { isString } from "@/types/guard";

import type { TLoading } from "@/types/shared";
import { actGetCabinetDetails } from "./act/actGetCabinetDetails";

interface ICabinetsState {
  cabinets: Cabinet[];
  searchResults: Cabinet[];
  selectedCabinet: Cabinet | null; // New state for single cabinet details
  loading: TLoading;
  error: string | null;
}

const initialState: ICabinetsState = {
  cabinets: [],
  searchResults: [],
  selectedCabinet: null,
  loading: "idle",
  error: null,
};

const cabinetsSlice = createSlice({
  name: "cabinets",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearSelectedCabinet: (state) => {
      state.selectedCabinet = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle actGetAllCabinetsActive
      .addCase(actGetAllCabinetsActive.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(actGetAllCabinetsActive.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.cabinets = action.payload.cabinets || [];
      })
      .addCase(actGetAllCabinetsActive.rejected, (state, action) => {
        state.loading = "failed";
        if (isString(action.payload)) {
          state.error = action.payload;
        }
        state.cabinets = [];
      })
      // Handle actSearch
      .addCase(actSearch.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(actSearch.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.searchResults =
          action.payload.data?.cabinets || action.payload || [];
      })
      .addCase(actSearch.rejected, (state, action) => {
        state.loading = "failed";
        state.searchResults = [];
        state.error = isString(action.payload)
          ? action.payload
          : "Unknown error";
      })
      // Handle actGetCabinetDetails
      .addCase(actGetCabinetDetails.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.selectedCabinet = null;
      })
      .addCase(actGetCabinetDetails.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.selectedCabinet = action.payload;
      })
      .addCase(actGetCabinetDetails.rejected, (state, action) => {
        state.loading = "failed";
        state.selectedCabinet = null;
        state.error = isString(action.payload)
          ? action.payload
          : "Unknown error";
      });
  },
});

export const { clearError, clearSearchResults, clearSelectedCabinet } =
  cabinetsSlice.actions;
export default cabinetsSlice.reducer;
