export interface Cabinet {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  image: string | null;
  address: string;
  city: string;
  postal_code: string;
  email: string | null;
  opening_time: string;
  closing_time: string;
  working_days: (
    | "lundi"
    | "mardi"
    | "mercredi"
    | "jeudi"
    | "vendredi"
    | "samedi"
    | "dimanche"
  )[];
  latitude: string;
  longitude: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_name: string | null;
  owner_email: string | null;
  specialities: string | null;
}

export interface CabinetsState {
  cabinets: Cabinet[];
  loading: boolean;
  error: string | null;
}
