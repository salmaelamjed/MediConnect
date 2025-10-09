import { createSlice } from "@reduxjs/toolkit";
import type { Cabinet } from "@/types/cabinet";
import type { TLoading } from "@/types/shared";
import { isString } from "@/types/guard";
import { actSearchCabinet } from "./act/actSearchCabinet";

// Define the state interface
interface CabinetState {
  searchResults: Cabinet[];
  loading: TLoading;
  error: string | null;
}

// Initial state
const initialState: CabinetState = {
  searchResults: [],
  loading: "idle",
  error: null,
};

// Create the slice
const cabinetSlice = createSlice({
  name: "cabinets",
  initialState,
  reducers: {
    // Action to clear search results
    clearSearchResults(state) {
      state.searchResults = [];
      state.loading = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Handle actSearch pending
    builder.addCase(actSearchCabinet.pending, (state) => {
      state.loading = "pending";
      state.error = null;
    });
    // Handle actSearch fulfilled
    builder.addCase(actSearchCabinet.fulfilled, (state, action) => {
      state.searchResults = action.payload;
      state.loading = "succeeded";
      state.error = null;
    });
    // Handle actSearch rejected
    builder.addCase(actSearchCabinet.rejected, (state, action) => {
      state.loading = "failed";
      state.error = isString(action.payload) ? action.payload : "Unknown error";
    });
  },
});

export const { clearSearchResults } = cabinetSlice.actions;
export default cabinetSlice.reducer;
