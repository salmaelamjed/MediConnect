import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";
import type { NotificationResponse } from "@/types/notification";

export const actMarkAllNotificationsAsRead = createAsyncThunk(
  "notifications/actMarkAllNotificationsAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.put<NotificationResponse>(
        `http://localhost:8000/api/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);
