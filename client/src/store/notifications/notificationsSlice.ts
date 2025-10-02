import { createSlice } from "@reduxjs/toolkit";

import type {
  Notification,
  MarkNotificationResponse,
} from "@/types/notification";
import type { TLoading } from "@/types/shared";
import type { PaginationInfo } from "@/types/pagination";
import { isString } from "@/types/guard";
import { actGetNotifications } from "./act/actGetNotifications";
import { actMarkNotificationAsRead } from "./act/actMarkNotificationAsRead";
import { actMarkAllNotificationsAsRead } from "./act/actMarkAllNotificationsAsRead";

interface INotificationsState {
  notifications: Notification[];
  loading: TLoading;
  error: string | null;
  successMessage: string | null;
  pagination: PaginationInfo | null;
}

const initialState: INotificationsState = {
  notifications: [],
  loading: "idle",
  error: null,
  successMessage: null,
  pagination: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.successMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Notifications
      .addCase(actGetNotifications.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(actGetNotifications.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.notifications = action.payload.data;
        state.pagination = {
          ...action.payload.meta,
          from:
            (action.payload.meta.current_page - 1) *
              action.payload.meta.per_page +
            1,
          to: Math.min(
            action.payload.meta.current_page * action.payload.meta.per_page,
            action.payload.meta.total
          ),
        };
        state.successMessage = action.payload.success
          ? action.payload.message || "Notifications fetched successfully"
          : null;
      })
      .addCase(actGetNotifications.rejected, (state, action) => {
        state.loading = "failed";
        state.error = isString(action.payload)
          ? action.payload
          : "Failed to fetch notifications";
      })
      // Mark Single Notification as Read
      .addCase(actMarkNotificationAsRead.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(
        actMarkNotificationAsRead.fulfilled,
        (state, action: { payload: MarkNotificationResponse }) => {
          state.loading = "succeeded";
          const updatedNotification = action.payload.data;
          state.notifications = state.notifications.map((notif) =>
            notif.id === updatedNotification.id
              ? {
                  ...notif,
                  is_read: true,
                  read_at: updatedNotification.read_at,
                }
              : notif
          );
          state.successMessage = action.payload.success
            ? action.payload.message
            : null;
        }
      )
      .addCase(actMarkNotificationAsRead.rejected, (state, action) => {
        state.loading = "failed";
        state.error = isString(action.payload)
          ? action.payload
          : "Failed to mark notification as read";
      })
      // Mark All Notifications as Read
      .addCase(actMarkAllNotificationsAsRead.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(actMarkAllNotificationsAsRead.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.notifications = action.payload.data;
        state.pagination = {
          ...action.payload.meta,
          from:
            (action.payload.meta.current_page - 1) *
              action.payload.meta.per_page +
            1,
          to: Math.min(
            action.payload.meta.current_page * action.payload.meta.per_page,
            action.payload.meta.total
          ),
        };
        state.successMessage = action.payload.success
          ? action.payload.message || "All notifications marked as read"
          : null;
      })
      .addCase(actMarkAllNotificationsAsRead.rejected, (state, action) => {
        state.loading = "failed";
        state.error = isString(action.payload)
          ? action.payload
          : "Failed to mark all notifications as read";
      });
  },
});

export const { clearMessages } = notificationsSlice.actions;
export default notificationsSlice.reducer;