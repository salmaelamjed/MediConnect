import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { Cabinet } from "@/types/cabinet";
import { isaxiosErrorHandler } from "@/Util";

// Define the thunk's argument type
interface SearchParams {
  searchTerm: string;
  date?: string;
  specialtyId?: number;
}

// Define the expected API response type
interface SearchResponse {
  status: string;
  data: Cabinet[];
  message: string;
}

// In your actSearchCabinet file
export const actSearchCabinet = createAsyncThunk<
  Cabinet[],
  SearchParams,
  { rejectValue: string }
>(
  "search/actSearchCabinet",
  async ({ searchTerm, date, specialtyId }, { rejectWithValue }) => {
    try {
      const response = await axios.get<SearchResponse>(
        "http://localhost:8000/api/search",
        {
          params: {
            search_term: searchTerm,
            date,
            specialty_id: specialtyId,
          },
        }
      );

      // Check if the response status is success
      if (response.data.status !== "success") {
        return rejectWithValue(response.data.message || "Search failed");
      }

      // Ensure we always return an array, even if data is null/undefined
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(isaxiosErrorHandler(error));
    }
  }
);