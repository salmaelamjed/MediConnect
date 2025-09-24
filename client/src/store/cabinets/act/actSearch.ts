import type { Cabinet } from "@/types/cabinet";
import { isaxiosErrorHandler } from "@/Util";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
interface SearchResponse {
  success: boolean;
  message: string;
  data: {
    cabinets: Cabinet[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    };
    filters_applied: Record<string, any>;
  };
}
export const actSearch = createAsyncThunk(
  "cabinets/actSearch",
  async (searchTerm: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<SearchResponse>(
        `http://localhost:8000/api/search/cabinets?q=${encodeURIComponent(
          searchTerm
        )}`
      );

      console.log("API Response:", response.data); // Debug log

      return response.data;
    } catch (error) {
      console.error("Search API Error:", error); 
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);
