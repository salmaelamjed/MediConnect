/**
 * Type definition for a Staff member, based on the Laravel 'staff' table schema and API response.
 * Represents a staff member in the MediConnect application, including related user and cabinet data.
 */
export interface Staff {
  id: number; // Unique identifier for the staff member
  user_id: number; // Foreign key linking to the users table
  cabinet_id: number | null; // Foreign key linking to the cabinets table, nullable
  name: string; // Staff member's name
  job_title: string; // Job title (e.g., Médecin, Propriétaire, Nurse, Receptionist)
  phone_number: string | null; // Contact phone number, nullable
  bio: string | null; // Brief description or qualifications, nullable
  working_days: string[] | null; // Array of working days (e.g., ["lundi", "mardi"]), nullable
  start_time: string | null; // Daily work start time (e.g., "09:00:00"), nullable
  end_time: string | null; // Daily work end time (e.g., "18:00:00"), nullable
  is_active: boolean; // Staff status, defaults to true
  created_at: string; // ISO date string for creation timestamp (e.g., "2025-10-24T01:05:46.000000Z")
  updated_at: string; // ISO date string for last update timestamp

  // Additional fields for doctor staff
  speciality_id?: number;
  license_number?: string;
  consultation_fees?: number;

  // Related user data
  user: {
    id: number; // User ID
    email: string; // User email
    email_verified_at: string | null; // Email verification timestamp
    role: string; // User role (e.g., "doctor")
    is_active: number; // User active status (1 for active, 0 for inactive)
    profile_image: string; // URL to profile image
    verification_code_expires_at: string | null; // Verification code expiration timestamp
    created_at: string; // User creation timestamp
    updated_at: string; // User last update timestamp
  };

  // Related cabinet data
  cabinet: {
    id: number; // Cabinet ID
    owner_id: number; // Foreign key to the owner (user)
    name: string; // Cabinet name (e.g., "Clinic El farah")
    description: string | null; // Cabinet description, nullable
    image: string; // URL to cabinet image
    detail_images: string[] | null; // Array of detail image URLs, nullable
    address: string; // Cabinet address
    city: string; // City (e.g., "settat")
    postal_code: string; // Postal code (e.g., "26000")
    email: string; // Cabinet email
    opening_time: string; // Opening time (e.g., "08:00")
    closing_time: string; // Closing time (e.g., "22:00")
    working_days: string[]; // Array of working days (e.g., ["lundi", "mardi"])
    latitude: string; // Latitude coordinate
    longitude: string; // Longitude coordinate
    is_active: boolean; // Cabinet active status
    created_at: string; // Cabinet creation timestamp
    updated_at: string; // Cabinet last update timestamp
  };
}

// Define form data interface for adding staff
export interface StaffFormData {
  email: string;
  password?: string;
  password_confirmation?: string;
  name: string;
  speciality_id: number;
  license_number: string;
  bio: string;
  consultation_fees: number;
  start_time: string;
  end_time: string;
  available_days: string[];
  profile_image: string;
}

// Define form data interface for editing staff (no password fields)
export interface StaffEditFormData {
  email: string;
  name: string;
  speciality_id: number;
  license_number: string;
  bio: string;
  consultation_fees: number;
  start_time: string;
  end_time: string;
  available_days: string[];
  profile_image: string;
}

/**
 * Utility function to normalize working_days, handling both JSON string and array formats.
 * @param workingDays - The working_days field from the API (string or string[])
 * @returns Normalized array of working days or null
 */
export function normalizeWorkingDays(
  workingDays: string | string[] | null
): string[] | null {
  if (!workingDays) return null;
  if (Array.isArray(workingDays)) return workingDays;
  try {
    return JSON.parse(workingDays) as string[];
  } catch (e) {
    console.error("Failed to parse working_days:", e);
    return null;
  }
}
