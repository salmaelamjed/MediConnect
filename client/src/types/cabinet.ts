export interface Cabinet {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  image: string;
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
  created_at: string;
  updated_at: string;
}

export interface CabinetsState {
  cabinets: Cabinet[];
  loading: boolean;
  error: string | null;
}
