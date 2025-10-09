import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";
import type { MarkNotificationResponse } from "@/types/notification";

export const actMarkNotificationAsRead = createAsyncThunk(
  "notifications/actMarkNotificationAsRead",
  async (notificationId: number, { rejectWithValue }) => {
    try {
      const response = await axios.put<MarkNotificationResponse>(
        `http://localhost:8000/api/notifications/${notificationId}/read`,
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
