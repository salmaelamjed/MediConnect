<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Schedule;
use App\Services\NominatimService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\VerificationCode;
use App\Models\Cabinet;
use App\Models\CabinetSpeciality;
use App\Models\Speciality;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected $nominatimService;

    public function __construct(NominatimService $nominatimService)
    {
        $this->nominatimService = $nominatimService;
    }

    /**
     * Register a new user and send verification code
     * Ensures ALL validation passes before creating ANY data
     */
    public function register(Request $request)
    {
        // Step 1: Complete validation before ANY data creation
        $this->validateRegistrationData($request);

        // Step 2: Additional business logic validations
        $this->validateBusinessRules($request);

        // Step 3: Pre-validate external dependencies (like geocoding)
        $geocodeData = $this->preValidateGeocoding($request);

        // Step 4: Only after ALL validations pass, create data in transaction
        try {
            return DB::transaction(function () use ($request, $geocodeData) {
                // Generate 6-digit verification code
                $verificationCode = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);

                // Determine profile image
                $profileImageName = $request->role === 'doctor'
                    ? ($request->cabinet_option === 'new' ? $request->cabinet_name : $request->name)
                    : $request->name;

                // Create user
                $user = User::create([
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'role' => $request->role,
                    'is_active' => false,
                    'profile_image' => "https://ui-avatars.com/api/?name=" . urlencode($profileImageName),
                    'verification_code' => $verificationCode,
                    'verification_code_expires_at' => now()->addHours(24),
                ]);

                // Create role-specific data
                if ($request->role === 'patient') {
                    $this->createPatient($user, $request);
                } elseif ($request->role === 'doctor') {
                    $this->createDoctorWithCabinet($user, $request, $geocodeData);
                }

                // Send verification email
                $this->sendVerificationEmail($user, $verificationCode);

                return response()->json([
                    'message' => 'Utilisateur enregistré avec succès. Veuillez vérifier votre email pour le code de vérification.',
                    'user' => $user->only(['id', 'email', 'role']),
                ], 201);
            });
        } catch (\Exception $e) {
            Log::error('Registration failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Échec de l\'enregistrement',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Comprehensive validation of all registration data
     */
    private function validateRegistrationData(Request $request)
    {
        $rules = [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
            'role' => 'required|in:admin,doctor,patient',
        ];

        // Role-specific validation rules
        if ($request->role === 'doctor' || $request->role === 'patient') {
            $rules['name'] = 'required|string|min:2|max:255';
        }

        // Doctor-specific validation
        if ($request->role === 'doctor') {
            $rules = array_merge($rules, [
                'speciality_id' => 'required|exists:specialities,id',
                'license_number' => 'required|string|unique:doctors,license_number|min:5|max:50',
                'bio' => 'nullable|string|max:1000',
                'consultation_fees' => 'required|numeric|min:0|max:999999.99',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
                'available_days' => 'required|array|min:1|max:7',
                'available_days.*' => 'required|string|in:lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche',
                'cabinet_option' => 'required|in:new,existing',
            ]);

            // Cabinet-specific validation based on option
            if ($request->cabinet_option === 'existing') {
                $rules['cabinet_id'] = 'required|exists:cabinets,id';
            } else {
                $rules = array_merge($rules, [
                    'cabinet_name' => 'required|string|min:2|max:255',
                    'cabinet_description' => 'nullable|string|max:1000',
                    'cabinet_address' => 'required|string|min:10|max:500',
                    'cabinet_city' => 'required|string|min:2|max:100',
                    'cabinet_postal_code' => 'required|string|min:4|max:10',
                    'cabinet_email' => 'nullable|email|max:255',
                    'cabinet_opening_time' => 'required|date_format:H:i',
                    'cabinet_closing_time' => 'required|date_format:H:i|after:cabinet_opening_time',
                    'cabinet_working_days' => 'required|array|min:1|max:7',
                    'cabinet_working_days.*' => 'required|string|in:lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche',
                ]);
            }
        }

        // Patient-specific validation
        if ($request->role === 'patient') {
            $rules = array_merge($rules, [
                'date_of_birth' => 'required|date|before:today|after:1900-01-01',
                'gender' => 'required|in:Female,Male',
                'address' => 'required|string|min:10|max:500',
                'city' => 'required|string|min:2|max:100',
                'code_postal' => 'required|string|min:4|max:10',
                'medical_history' => 'nullable|string|max:2000',
                'allergies' => 'nullable|string|max:1000',
            ]);
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }

    /**
     * Additional business logic validations
     */
    private function validateBusinessRules(Request $request)
    {
        if ($request->role === 'doctor') {
            // Validate time constraints
            if ($request->start_time >= $request->end_time) {
                throw ValidationException::withMessages([
                    'end_time' => 'L\'heure de fin de consultation doit être après l\'heure de début'
                ]);
            }

            // Validate cabinet times for new cabinets
            if ($request->cabinet_option === 'new' &&
                $request->cabinet_opening_time >= $request->cabinet_closing_time) {
                throw ValidationException::withMessages([
                    'cabinet_closing_time' => 'L\'heure de fermeture du cabinet doit être après l\'heure d\'ouverture'
                ]);
            }

            // Validate that doctor's hours are within cabinet hours for new cabinets
            if ($request->cabinet_option === 'new') {
                if ($request->start_time < $request->cabinet_opening_time ||
                    $request->end_time > $request->cabinet_closing_time) {
                    throw ValidationException::withMessages([
                        'start_time' => 'Les heures de consultation du médecin doivent être dans les heures d\'ouverture du cabinet'
                    ]);
                }
            }

            // Validate available days are unique
            if (count($request->available_days) !== count(array_unique($request->available_days))) {
                throw ValidationException::withMessages([
                    'available_days' => 'Les jours disponibles ne peuvent pas être dupliqués'
                ]);
            }

            // For existing cabinet, validate speciality compatibility
            if ($request->cabinet_option === 'existing') {
                $this->validateCabinetSpecialityCompatibility($request->cabinet_id, $request->speciality_id);
            }
        }

        if ($request->role === 'patient') {
            // Validate age is reasonable (not too young, not too old)
            $age = \Carbon\Carbon::parse($request->date_of_birth)->age;
            if ($age < 0 || $age > 150) {
                throw ValidationException::withMessages([
                    'date_of_birth' => 'Date de naissance invalide'
                ]);
            }
        }
    }

    /**
     * Pre-validate geocoding for new cabinets
     */
    private function preValidateGeocoding(Request $request)
    {
        $geocodeData = null;

        if ($request->role === 'doctor' && $request->cabinet_option === 'new') {
            try {
                $geocodeResults = $this->nominatimService->geocode(
                    $request->cabinet_address,
                    $request->cabinet_city,
                    $request->cabinet_postal_code
                );

                if (empty($geocodeResults)) {
                    throw ValidationException::withMessages([
                        'cabinet_address' => 'Impossible de géocoder l\'adresse du cabinet. Veuillez vérifier l\'adresse et inclure des détails comme le numéro de rue ou un point de repère.'
                    ]);
                }

                $geocodeData = $geocodeResults[0];

                // Validate geocoding quality
                if (!isset($geocodeData['lat']) || !isset($geocodeData['lon'])) {
                    throw ValidationException::withMessages([
                        'cabinet_address' => 'Les coordonnées de l\'adresse n\'ont pas pu être déterminées avec précision.'
                    ]);
                }

            } catch (\Exception $e) {
                Log::warning('Geocoding failed for address: ' . $request->cabinet_address . ' - ' . $e->getMessage());
                throw ValidationException::withMessages([
                    'cabinet_address' => 'Erreur lors de la validation de l\'adresse du cabinet.'
                ]);
            }
        }

        return $geocodeData;
    }

    /**
     * Validate cabinet-speciality compatibility for existing cabinets
     */
    private function validateCabinetSpecialityCompatibility($cabinetId, $specialityId)
    {
        $cabinet = Cabinet::find($cabinetId);
        if (!$cabinet || !$cabinet->is_active) {
            throw ValidationException::withMessages([
                'cabinet_id' => 'Le cabinet sélectionné n\'est pas actif ou n\'existe pas.'
            ]);
        }

        // Check if cabinet already has this speciality or if it can accept new specialities
        $existingSpecialities = CabinetSpeciality::where('cabinet_id', $cabinetId)->count();
        if ($existingSpecialities >= 10) { // Assuming max 10 specialities per cabinet
            throw ValidationException::withMessages([
                'speciality_id' => 'Ce cabinet a atteint le nombre maximum de spécialités.'
            ]);
        }
    }

    /**
     * Create patient profile
     */
    private function createPatient($user, $request)
    {
        return Patient::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'date_of_birth' => $request->date_of_birth,
            'gender' => $request->gender,
            'address' => $request->address,
            'city' => $request->city,
            'code_postal' => $request->code_postal,
            'medical_history' => $request->medical_history,
            'allergies' => $request->allergies,
        ]);
    }

    /**
     * Create doctor with cabinet
     */
    private function createDoctorWithCabinet($user, $request, $geocodeData)
    {
        $cabinetId = null;

        // Handle cabinet creation or assignment
        if ($request->cabinet_option === 'new') {
            $cabinet = Cabinet::create([
                'owner_id' => $user->id,
                'name' => $request->cabinet_name,
                'description' => $request->cabinet_description,
                'image' => "https://i.pinimg.com/1200x/c6/3e/4b/c63e4baabab225b16b85b9e7bcc05069.jpg",
                'address' => $request->cabinet_address,
                'city' => $request->cabinet_city,
                'postal_code' => $request->cabinet_postal_code,
                'email' => $request->cabinet_email,
                'opening_time' => $request->cabinet_opening_time,
                'closing_time' => $request->cabinet_closing_time,
                'working_days' => $request->cabinet_working_days,
                'latitude' => $geocodeData['lat'] ?? null,
                'longitude' => $geocodeData['lon'] ?? null,
                'is_active' => true,
            ]);

            $cabinetId = $cabinet->id;

            // Associate speciality with new cabinet
            CabinetSpeciality::create([
                'cabinet_id' => $cabinet->id,
                'speciality_id' => $request->speciality_id,
            ]);
        } else {
            $cabinetId = $request->cabinet_id;

            // Add speciality to existing cabinet if not present
            $cabinetSpeciality = CabinetSpeciality::where('cabinet_id', $cabinetId)
                ->where('speciality_id', $request->speciality_id)
                ->first();

            if (!$cabinetSpeciality) {
                CabinetSpeciality::create([
                    'cabinet_id' => $cabinetId,
                    'speciality_id' => $request->speciality_id,
                ]);
            }
        }

        // Create doctor profile
        $doctor = Doctor::create([
            'user_id' => $user->id,
            'speciality_id' => $request->speciality_id,
            'cabinet_id' => $cabinetId,
            'name' => $request->name,
            'license_number' => $request->license_number,
            'bio' => $request->bio,
            'consultation_fees' => $request->consultation_fees,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'available_days' => $request->available_days,
            'is_active' => true,
        ]);

        // Create schedules for the doctor
        foreach ($request->available_days as $day) {
            Schedule::create([
                'doctor_id' => $doctor->id,
                'cabinet_id' => $cabinetId,
                'day_of_week' => $this->translateDay($day),
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'slot_duration' => 30,
                'buffer_time' => 0,
                'max_patients_per_slot' => 1,
                'is_active' => true,
                'allow_online_booking' => true,
                'advance_booking_days' => 30,
                'min_booking_hours' => 24,
                'effective_from' => now()->toDateString(),
            ]);
        }

        return $doctor;
    }

    /**
     * Send verification email
     */
    private function sendVerificationEmail($user, $verificationCode)
    {
        try {
            Log::info('Sending verification code: ' . $verificationCode . ' to email: ' . $user->email);
            Mail::to($user->email)->send(new VerificationCode($verificationCode));
            Log::info('Verification email sent successfully');
        } catch (\Exception $e) {
            Log::error('Failed to send verification email: ' . $e->getMessage());
            throw new \Exception('Failed to send verification email: ' . $e->getMessage());
        }
    }

    /**
     * Translate French day to English for schedule compatibility
     */
    private function translateDay($frenchDay)
    {
        $daysMap = [
            'lundi' => 'monday',
            'mardi' => 'tuesday',
            'mercredi' => 'wednesday',
            'jeudi' => 'thursday',
            'vendredi' => 'friday',
            'samedi' => 'saturday',
            'dimanche' => 'sunday',
        ];
        return $daysMap[$frenchDay] ?? $frenchDay;
    }

    /**
     * Get available specialities for registration form
     */
    public function getSpecialities()
    {
        try {
            $specialities = Speciality::where('is_active', true)
                ->select('id', 'name', 'description', 'icon')
                ->orderBy('name')
                ->get();

            return response()->json([
                'specialities' => $specialities
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des spécialités',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available cabinets for a specific speciality
     */
    public function getCabinetsBySpeciality(Request $request)
    {
        $request->validate([
            'speciality_id' => 'required|exists:specialities,id'
        ]);

        try {
            $cabinets = Cabinet::whereHas('specialities', function ($query) use ($request) {
                $query->where('speciality_id', $request->speciality_id);
            })
                ->where('is_active', true)
                ->select('id', 'name', 'address', 'city', 'description')
                ->orderBy('name')
                ->get();

            return response()->json([
                'cabinets' => $cabinets
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des cabinets',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify email using the provided code
     */
    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();

            // Check if already verified
            if ($user->email_verified_at) {
                return response()->json([
                    'message' => 'Email already verified',
                ], 400);
            }

            // Check code validity and expiration
            if ($user->verification_code !== $request->code) {
                return response()->json([
                    'message' => 'Invalid verification code',
                ], 400);
            }

            if ($user->verification_code_expires_at < now()) {
                return response()->json([
                    'message' => 'Verification code has expired',
                ], 400);
            }

            // Update user verification status
            $user->update([
                'email_verified_at' => now(),
                'is_active' => true,
                'verification_code' => null,
                'verification_code_expires_at' => null,
            ]);

            return response()->json([
                'message' => 'Email verified successfully',
                'user' => $user->only(['id', 'email', 'role']),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Email verification failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Resend verification code
     */
    public function resendVerificationCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();

            // Check if already verified
            if ($user->email_verified_at) {
                return response()->json([
                    'message' => 'Email already verified',
                ], 400);
            }

            // Generate new code
            $verificationCode = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);

            // Update user with new code and expiration
            $user->update([
                'verification_code' => $verificationCode,
                'verification_code_expires_at' => now()->addHours(24),
            ]);

            // Send verification email
            $this->sendVerificationEmail($user, $verificationCode);

            return response()->json([
                'message' => 'Verification code resent successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to resend verification code',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login user and verify email status
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        $user = Auth::user();
        $role = $user->role;

        // Check if email is verified
        if (!$user->email_verified_at) {
            return response()->json([
                'message' => 'Please verify your email before logging in',
            ], 403);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Account is inactive',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Check if the user is a doctor and owns a cabinet
        $isCabinetOwner = false;
        if ($role === 'doctor') {
            $isCabinetOwner = Cabinet::where('owner_id', $user->id)->exists();
        }

        return response()->json([
            'message' => 'Login successful',
            'user' => $user->only(['id', 'email', 'role']),
            'token' => $token,
            'role' => $role,
            'is_cabinet_owner' => $isCabinetOwner,
        ], 200);
    }

    /**
     * Logout the authenticated user
     */
    public function logout(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated',
                ], 401);
            }

            // Invalidate the current token
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'message' => 'Logout successful',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Logout failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
