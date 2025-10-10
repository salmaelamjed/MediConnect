export interface Staff {
  id: number;
  user_id: number;
  cabinet_id: number;
  name: string;
  job_title: string;
  phone_number: string | null;
  bio: string | null;
  working_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    email: string;
    email_verified_at: string | null;
    role: "admin" | "doctor" | "patient" | "staff";
    is_active: boolean;
    profile_image: string | null;
    verification_code_expires_at: string | null;
    created_at: string;
    updated_at: string;
  };
   cabinet: {
    id: number;
    owner_id: number;
    name: string;
    description: string | null;
    image: string | null;
    detail_images: string | null;
    address: string;
    city: string;
    postal_code: string;
    email: string | null;
    opening_time: string | null;
    closing_time: string | null;
    working_days: string[] | null;
    latitude: string;
    longitude: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}