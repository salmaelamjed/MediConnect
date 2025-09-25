import { createSlice } from "@reduxjs/toolkit";
import { isString } from "@/types/guard";
import type { Reservation } from "@/types/reservation";
import type { TLoading } from "@/types/shared";
import { actCreateReservation } from "./act/actCreateReservation";
import {
  actGetAvailableSlots,
} from "./act/actGetAvailableSlots";

interface IReservationsState {
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  loading: TLoading;
  error: string | null;
  availableSlots: string[];
  slotsLoading: TLoading;
  slotsError: string | null;
}

const initialState: IReservationsState = {
  reservations: [],
  selectedReservation: null,
  loading: "idle",
  error: null,
  availableSlots: [],
  slotsLoading: "idle",
  slotsError: null,
};

const reservationsSlice = createSlice({
  name: "reservations",
  initialState,
  reducers: {
    reservationsRecordsCleanUp: (state) => {
      state.reservations = [];
      state.selectedReservation = null;
      state.availableSlots = [];
      state.slotsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create reservation
      .addCase(actCreateReservation.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(actCreateReservation.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.reservations.push(action.payload);
      })
      .addCase(actCreateReservation.rejected, (state, action) => {
        state.loading = "failed";
        state.error = isString(action.payload)
          ? action.payload
          : "Unknown error";
      })
      // Get available slots
      .addCase(actGetAvailableSlots.pending, (state) => {
        state.slotsLoading = "pending";
        state.slotsError = null;
        state.availableSlots = [];
      })
      .addCase(actGetAvailableSlots.fulfilled, (state, action) => {
        state.slotsLoading = "succeeded";
        state.availableSlots = action.payload.available_slots;
      })
      .addCase(actGetAvailableSlots.rejected, (state, action) => {
        state.slotsLoading = "failed";
        state.slotsError = isString(action.payload)
          ? action.payload
          : "Unknown error";
      });
  },
});

export { actCreateReservation, actGetAvailableSlots };
export const { reservationsRecordsCleanUp } = reservationsSlice.actions;
export default reservationsSlice.reducer;
