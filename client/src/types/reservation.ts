export interface Reservation {
  id: number;
  patient_id: number;
  doctor_id: number;
  cabinet_id: number;
  reservation_date: string; // Format: YYYY-MM-DD
  reservation_time: string; // Format: HH:mm
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  reason?: string | null;
  doctor_notes?: string | null;
  email_reminder_sent: boolean;
  reminder_sent_at?: string | null; // ISO 8601 format
  patient_email?: string | null;
  is_follow_up: boolean;
  confirmed_at?: string | null; // ISO 8601 format
  cancelled_at?: string | null; // ISO 8601 format
  cancelled_by?: "patient" | "doctor" | "admin" | null;
  cancellation_reason?: string | null;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

export interface Doctor {
  id: number;
  name: string;
  specialty?: string;
  user_id: number;
}
