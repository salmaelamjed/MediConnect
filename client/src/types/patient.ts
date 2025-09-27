import type { User } from "./user";

export interface Patient {
  id: number;
  user_id: number;
  date_of_birth: string; // "2003-03-10"
  gender: string; // "Male"
  address: string;
  city: string;
  code_postal: string; // "26000"
  medical_history: string;
  allergies: string;
  created_at: string;
  updated_at: string;
  user: User;
}
