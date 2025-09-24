export interface Doctor {
  id: number;
  user_id?: number;
  cabinet_id?: number;
  name: string;
  license_number: string;
  bio: string;
  consultation_fees: string;
  start_time: string;
  end_time: string;
  available_days: string[];
  is_active: boolean;
  speciality: {
    id: number;
    name: string;
    icon: string;
  };
}
