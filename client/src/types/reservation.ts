import type { Cabinet } from "./cabinet";
import type { Patient } from "./patient";

export interface Reservation {
  id: number;
  patient_id: number;
  doctor_id: number;
  cabinet_id: number;
  reservation_date: string; // "2025-09-28T23:00:00.000000Z"
  reservation_time: string; // "10:00"
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  reason: string | null;
  doctor_notes: string | null;
  email_reminder_sent: boolean;
  reminder_sent_at: string | null;
  patient_email: string | null;
  is_follow_up: boolean;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: "patient" | "doctor" | "admin" | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;

  // Relations incluses dans la réponse API
  patient: Patient;
  doctor: Doctor;
  cabinet: Cabinet;
}

export interface Doctor {
  id: number;
  name: string;
  specialty?: string;
  user_id: number;
}
