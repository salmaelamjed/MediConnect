import type { PaginationInfo } from "./pagination";

export interface Notification {
  id: number;
  user_id: number;
  reservation_id: number | null;
  title: string;
  message: string;
  type:
    | "appointment_confirmation"
    | "appointment_reminder"
    | "appointment_cancellation"
    | "appointment_rescheduled"
    | "doctor_message"
    | "system_update"
    | "review_request";
  send_email: boolean;
  send_push: boolean;
  is_read: boolean;
  read_at: string | null;
  sent_at: string | null;
  delivery_status: {
    email: string;
    push: string;
  } | null;
  priority: "low" | "normal" | "high" | "urgent";
  scheduled_for: string | null;
  data: any | null; // Using 'any' since the structure is not specified
  action_url: string | null;
  created_at: string;
  updated_at: string;
  reservation?: {
    id: number;
    patient_id: number;
    doctor_id: number;
    cabinet_id: number;
    reservation_date: string;
    reservation_time: string;
    reason: string;

    status: string;
    patient: {
      id: number;
      user_id: number;
      date_of_birth: string;
      gender: string;
      user: {
        id: number;
        email: string;
        role: string;
      };
    };
  } | null;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  message?: string;
  meta: PaginationInfo;
}
export interface MarkNotificationResponse {
  success: boolean;
  message: string;
  data: Notification;
}
