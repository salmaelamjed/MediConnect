import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isaxiosErrorHandler } from "@/Util";
import type { NotificationResponse } from "@/types/notification";

export const actGetNotifications = createAsyncThunk(
  "notifications/actGetNotifications",
  async (params: { page?: number } = { page: 1 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return rejectWithValue("No authentication token found. Please log in.");
      }

      const response = await axios.get<NotificationResponse>(
        `http://localhost:8000/api/notifications?page=${params.page || 1}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);
