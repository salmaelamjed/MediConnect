import { createAsyncThunk } from "@reduxjs/toolkit";

export const actDeleteStaff = createAsyncThunk(
  "staff/actDeleteStaff",
  async (id: number, thunkAPI) => {
    try {
    const token = localStorage.getItem("accessToken");
      const response = await fetch(`http://localhost:8000/api/staff/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        return thunkAPI.rejectWithValue(error);
      }
      return id; // Return the deleted id to remove from state
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);
