// types/cabinet.ts
export interface Cabinet {
  id: number;
  name: string;
  description: string | null;
  image: string;
  detail_images: string[];
  address: string;
  city: string;
  postal_code: string;
  email: string;
  opening_time: string;
  closing_time: string;
  working_days: string[];
  latitude: string;
  longitude: string;
  is_active: boolean;
  rating_avg: number;
  doctors_count: number;
  specialities: Array<{
    id: number;
    name: string;
    description: string;
    icon: string;
  }>;
  doctors: Array<{
    id: number;
    name: string;
    license_number: string;
    bio: string;
    consultation_fees: string;
    start_time: string;
    end_time: string;
    available_days: string[];
    doctor_profile_image: string;
    is_active: boolean;
    speciality: { id: number; name: string; icon: string };
  }>;
  owner: { id: number; name: string | null; email: string };
  is_open_now: boolean;
}