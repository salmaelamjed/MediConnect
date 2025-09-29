import { createSlice } from "@reduxjs/toolkit";
import { isString } from "@/types/guard";
import type { Reservation } from "@/types/reservation";
import type { TLoading } from "@/types/shared";
import { actCreateReservation } from "./act/actCreateReservation";
import { actGetAvailableSlots } from "./act/actGetAvailableSlots";
import { actGetReservations } from "./act/actGetReservations";
import { actDeleteReservation } from "./act/actDeleteReservation";
import { actUpdateReservation } from "./act/actUpdateReservation";
import type { PaginationInfo } from "@/types/pagination";
import { actConfirmReservation } from "./act/actConfirmReservation";
import { actCancelReservation } from "./act/actCancelReservation";
import { actCompleteReservation } from "./act/actCompleteReservation";
import { actGetStatsReservations } from "./act/actGetStatsReservations";

interface IReservationsState {
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  loading: TLoading;
  error: string | null;
  successMessage: string | null; // New field for success messages
  availableSlots: string[];
  slotsLoading: TLoading;
  slotsError: string | null;
  pagination: PaginationInfo | null;
}

const initialState: IReservationsState = {
  reservations: [],
  selectedReservation: null,
  loading: "idle",
  error: null,
  successMessage: null,
  availableSlots: [],
  slotsLoading: "idle",
  slotsError: null,
  pagination: null,
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
      state.pagination = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create reservation
      .addCase(actCreateReservation.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(actCreateReservation.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.reservations.push(action.payload);
        state.successMessage =
          action.payload.message || "Reservation created successfully";
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
      })
      // Get reservations
      .addCase(actGetReservations.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(actGetReservations.fulfilled, (state, action) => {
        state.loading = "succeeded";
        const apiData = action.payload.data;
        if (apiData) {
          state.reservations = apiData.data || [];
          state.pagination = {
            current_page: apiData.current_page,
            last_page: apiData.last_page,
            per_page: apiData.per_page,
            total: apiData.total,
            from: apiData.from,
            to: apiData.to,
          };
        } else {
          state.reservations = action.payload.data || action.payload || [];
          state.pagination = null;
        }
      })
      .addCase(actGetReservations.rejected, (state, action) => {
        state.loading = "failed";
        state.error = isString(action.payload)
          ? action.payload
          : "Unknown error";
      })
      // Delete reservation
      .addCase(actDeleteReservation.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(actDeleteReservation.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.reservations = state.reservations.filter(
          (reservation) => reservation.id !== action.payload.id
        );
        state.successMessage =
          action.payload.message || "Reservation deleted successfully";
      })
      .addCase(actDeleteReservation.rejected, (state, action) => {
        state.loading = "failed";
        state.error = isString(action.payload)
          ? action.payload
          : "Unknown error";
      })
      // Update reservation
      .addCase(actUpdateReservation.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(actUpdateReservation.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.reservations = state.reservations.map((reservation) =>
          reservation.id === action.payload.id
            ? { ...reservation, status: action.payload.data.status }
            : reservation
        );
        state.successMessage = action.payload.message;
      })
      .addCase(actUpdateReservation.rejected, (state, action) => {
        state.loading = "failed";
        state.error = isString(action.payload)
          ? action.payload
          : "Unknown error";
      })
      // Confirm Reservation
      .addCase(actConfirmReservation.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(actConfirmReservation.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.reservations = state.reservations.map((reservation) =>
          reservation.id === action.payload.id
            ? { ...reservation, status: "confirmed" }
            : reservation
        );
        state.successMessage = action.payload.message;
      })
      .addCase(actConfirmReservation.rejected, (state, action) => {
        state.loading = "failed";
        state.error = isString(action.payload)
          ? action.payload
          : "Unknown error";
      })
      // Cancel Reservation
      .addCase(actCancelReservation.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(actCancelReservation.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.reservations = state.reservations.map((reservation) =>
          reservation.id === action.payload.id
            ? {
                ...reservation,
                status: "cancelled",
                cancellation_reason: action.payload.data.cancellation_reason,
              }
            : reservation
        );
        state.successMessage = action.payload.message;
      })
      .addCase(actCancelReservation.rejected, (state, action) => {
        state.loading = "failed";
        state.error = isString(action.payload)
          ? action.payload
          : "Unknown error";
      })
      // Complete Reservation
      .addCase(actCompleteReservation.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(actCompleteReservation.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.reservations = state.reservations.map((reservation) =>
          reservation.id === action.payload.id
            ? {
                ...reservation,
                status: "completed",
                doctor_notes: action.payload.data.doctor_notes || "",
              }
            : reservation
        );
        state.successMessage = action.payload.message;
      })
      .addCase(actCompleteReservation.rejected, (state, action) => {
        state.loading = "failed";
        state.error = isString(action.payload)
          ? action.payload
          : "Unknown error";
      })
      // Get stats of reservations
      .addCase(actGetStatsReservations.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(actGetStatsReservations.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.reservations = action.payload;
      })
      .addCase(actGetStatsReservations.rejected, (state, action) => {
        state.loading = "failed";
        state.error = isString(action.payload)
          ? action.payload
          : "Unknown error";
      });
  },
});

export {
  actCreateReservation,
  actGetAvailableSlots,
  actDeleteReservation,
  actUpdateReservation,
};
export const { reservationsRecordsCleanUp } = reservationsSlice.actions;
export default reservationsSlice.reducer;
