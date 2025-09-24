import { createSlice } from "@reduxjs/toolkit";
import { actGetAllCabinetsActive } from "./act/actGetAllCabinetsActive";
import type { Cabinet } from "@/types/cabinet";
import { isString } from "@/types/guard";
import { actSearch } from "./act/actSearch";
import type { TLoading } from "@/types/shared";

interface ICabinetsState {
  cabinets: Cabinet[];
  searchResults: Cabinet[]; // Separate state for search results
  loading: TLoading;
  error: string | null;
}

const initialState: ICabinetsState = {
  cabinets: [],
  searchResults: [],
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
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(actSearch.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(actSearch.fulfilled, (state, action) => {
        state.loading = "succeeded";
        // Store search results separately
        state.searchResults =
          action.payload.data?.cabinets || action.payload|| [];
      })
      .addCase(actSearch.rejected, (state, action) => {
        state.loading = "failed";
        state.searchResults = [];
        state.error = isString(action.payload)
          ? action.payload
          : "Unknown error";
      });
  },
});

export const { clearError, clearSearchResults } = cabinetsSlice.actions;
export default cabinetsSlice.reducer;
