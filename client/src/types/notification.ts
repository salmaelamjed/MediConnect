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
  data: any | null;
  action_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  message?: string;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface MarkNotificationResponse {
  success: boolean;
  message: string;
  data: Notification;
}
