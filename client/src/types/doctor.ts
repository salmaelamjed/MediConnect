export interface Doctor {
  id: number;
  user_id: number;
  cabinet_id: number;
  name: string;
  license_number: string;
  bio: string;
  consultation_fees: string; // Could be number if you prefer numeric values
  start_time: string;
  end_time: string;
  available_days: (
    | "lundi"
    | "mardi"
    | "mercredi"
    | "jeudi"
    | "vendredi"
    | "samedi"
    | "dimanche"
  )[];
}
