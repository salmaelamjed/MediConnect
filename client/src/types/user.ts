
export interface User {
  id: number; 
  email: string;
  email_verified_at: Date | null;
  password: string;
  role: "admin" | "doctor" | "patient"; 
  is_active: boolean; 
  verification_code: string | null; 
  verification_code_expires_at: Date | null; 
  remember_token: string | null; 
  created_at: Date; 
  updated_at: Date; 
}
