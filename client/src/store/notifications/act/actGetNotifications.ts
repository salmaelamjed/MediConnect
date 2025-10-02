import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";
import type { NotificationResponse } from "@/types/notification";

export const actGetNotifications = createAsyncThunk(
  "notifications/actGetNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<NotificationResponse>(
        `http://localhost:8000/api/notifications`,
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
