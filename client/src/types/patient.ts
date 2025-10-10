import type { User } from "./user";

// Interface for the Patient object
export interface Patient {
  id: number;
  user_id: number;
  name: string;
  profile: string | null;
  date_of_birth: string; // e.g., "2003-03-10"
  gender: "Female" | "Male";
  address: string;
  city: string;
  code_postal: string; // e.g., "26000"
  medical_history: string | null;
  allergies: string | null;
  created_at: string;
  updated_at: string;
  user: User;
}

// Interface for the paginated Patient response
export interface PatientPaginatedResponse {
  success: boolean;
  data: Patient[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  message: string;
}

// Interface for single Patient response
export interface PatientResponse {
  success: boolean;
  data: Patient;
  message: string;
}

// Interface for error response
export interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}
