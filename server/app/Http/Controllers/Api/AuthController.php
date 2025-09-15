<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
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

class AuthController extends Controller
{
    protected $nominatimService;

    public function __construct(NominatimService $nominatimService)
    {
        $this->nominatimService = $nominatimService;
    }

    /**
     * Register a new user and send verification code
     */
    public function register(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
            'role' => 'required|in:admin,doctor,patient',
            'name' => $request->role === 'doctor' || $request->role === 'patient' ? 'required|string' : 'nullable|string',

            // Validation for doctors
            'speciality_id' => $request->role === 'doctor' ? 'required|exists:specialities,id' : 'nullable',
            'license_number' => $request->role === 'doctor' ? 'required|string|unique:doctors,license_number' : 'nullable|string',
            'bio' => $request->role === 'doctor' ? 'nullable|string' : 'nullable|string',
            'consultation_fees' => $request->role === 'doctor' ? 'required|numeric|min:0' : 'nullable|numeric',
            'start_time' => $request->role === 'doctor' ? 'required|date_format:H:i' : 'nullable',
            'end_time' => $request->role === 'doctor' ? 'required|date_format:H:i|after:start_time' : 'nullable',
            'available_days' => $request->role === 'doctor' ? 'required|array|min:1' : 'nullable',
            'available_days.*' => $request->role === 'doctor' ? 'required|string|in:lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche' : 'nullable',

            // Validation for cabinet (if the doctor creates a new cabinet)
            'cabinet_option' => $request->role === 'doctor' ? 'required|in:new,existing' : 'nullable',
            'cabinet_id' => $request->role === 'doctor' && $request->cabinet_option === 'existing' ? 'required|exists:cabinets,id' : 'nullable',

            // Fields for new cabinet
            'cabinet_name' => $request->role === 'doctor' && $request->cabinet_option === 'new' ? 'required|string' : 'nullable|string',
            'cabinet_description' => $request->role === 'doctor' && $request->cabinet_option === 'new' ? 'nullable|string' : 'nullable|string',
            'cabinet_address' => $request->role === 'doctor' && $request->cabinet_option === 'new' ? 'required|string' : 'nullable|string',
            'cabinet_city' => $request->role === 'doctor' && $request->cabinet_option === 'new' ? 'required|string' : 'nullable|string',
            'cabinet_postal_code' => $request->role === 'doctor' && $request->cabinet_option === 'new' ? 'required|string' : 'nullable|string',
            'cabinet_email' => $request->role === 'doctor' && $request->cabinet_option === 'new' ? 'nullable|email' : 'nullable|email',
            'cabinet_opening_time' => $request->role === 'doctor' && $request->cabinet_option === 'new' ? 'required|date_format:H:i' : 'nullable',
            'cabinet_closing_time' => $request->role === 'doctor' && $request->cabinet_option === 'new' ? 'required|date_format:H:i|after:cabinet_opening_time' : 'nullable',
            'cabinet_working_days' => $request->role === 'doctor' && $request->cabinet_option === 'new' ? 'required|array|min:1' : 'nullable',
            'cabinet_working_days.*' => $request->role === 'doctor' && $request->cabinet_option === 'new' ? 'required|string|in:lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche' : 'nullable',

            // Validation for patients
            'date_of_birth' => $request->role === 'patient' ? 'required|date|before:today' : 'nullable|date',
            'gender' => $request->role === 'patient' ? 'required|in:Female,Male' : 'nullable|in:Female,Male',
            'address' => $request->role === 'patient' ? 'required|string' : 'nullable|string',
            'city' => $request->role === 'patient' ? 'required|string' : 'nullable|string',
            'code_postal' => $request->role === 'patient' ? 'required|string' : 'nullable|string',
            'medical_history' => $request->role === 'patient' ? 'nullable|string' : 'nullable|string',
            'allergies' => $request->role === 'patient' ? 'nullable|string' : 'nullable|string',
        ]);

        // Custom validation for time fields
        if ($request->role === 'doctor') {
            if ($request->cabinet_option === 'new' &&
                $request->cabinet_opening_time >= $request->cabinet_closing_time) {
                return response()->json([
                    'error' => 'L\'heure de fermeture du cabinet doit être après l\'heure d\'ouverture'
                ], 400);
            }

            if ($request->start_time >= $request->end_time) {
                return response()->json([
                    'error' => 'L\'heure de fin de consultation doit être après l\'heure de début'
                ], 400);
            }
        }

        try {
            return DB::transaction(function () use ($request) {
                // Generate 6-digit verification code
                $verificationCode = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);

                // Determine profile image
                $profileImageName = $request->role === 'doctor'
                    ? ($request->cabinet_option === 'new' ? $request->cabinet_name : $request->name)
                    : $request->name;

                $user = User::create([
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'role' => $request->role,
                    'is_active' => false,
                    'profile_image' => "https://ui-avatars.com/api/?name=" . urlencode($profileImageName),
                    'verification_code' => $verificationCode,
                    'verification_code_expires_at' => now()->addHours(24),
                ]);

                if ($request->role === 'patient') {
                    Patient::create([
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
                } elseif ($request->role === 'doctor') {
                    $cabinetId = null;

                    // Handle cabinet
                    if ($request->cabinet_option === 'new') {
                        // Create new cabinet
                        $geocodeResults = $this->nominatimService->geocode($request->cabinet_address);

                        if (empty($geocodeResults)) {
                            throw new \Exception('Impossible de géocoder l\'adresse du cabinet');
                        }

                        $firstResult = $geocodeResults[0];

                        $cabinet = Cabinet::create([
                            'owner_id' => $user->id,
                            'name' => $request->cabinet_name,
                            'description' => $request->cabinet_description,
                            'image' => "https://ui-avatars.com/api/?name=" . urlencode($request->cabinet_name),
                            'address' => $request->cabinet_address,
                            'city' => $request->cabinet_city,
                            'postal_code' => $request->cabinet_postal_code,
                            'email' => $request->cabinet_email,
                            'opening_time' => $request->cabinet_opening_time,
                            'closing_time' => $request->cabinet_closing_time,
                            'working_days' => $request->cabinet_working_days,
                            'latitude' => $firstResult['lat'],
                            'longitude' => $firstResult['lon'],
                            'is_active' => true,
                        ]);

                        $cabinetId = $cabinet->id;

                        // Associate speciality with cabinet
                        CabinetSpeciality::create([
                            'cabinet_id' => $cabinet->id,
                            'speciality_id' => $request->speciality_id,
                        ]);
                    } elseif ($request->cabinet_option === 'existing') {
                        $cabinetId = $request->cabinet_id;

                        // Check if cabinet supports this speciality
                        $cabinetSpeciality = CabinetSpeciality::where('cabinet_id', $cabinetId)
                            ->where('speciality_id', $request->speciality_id)
                            ->first();

                        if (!$cabinetSpeciality) {
                            // Add speciality to cabinet if it doesn't exist
                            CabinetSpeciality::create([
                                'cabinet_id' => $cabinetId,
                                'speciality_id' => $request->speciality_id,
                            ]);
                        }
                    }

                    // Create doctor profile
                    Doctor::create([
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
                }

                // Send verification email
                try {
                    Log::info('Sending verification code: ' . $verificationCode . ' to email: ' . $user->email);

                    $mail = new VerificationCode($verificationCode);
                    Mail::to($user->email)->send($mail);

                    Log::info('Verification email sent successfully');
                } catch (\Exception $e) {
                    Log::error('Failed to send verification email: ' . $e->getMessage());
                    throw new \Exception('Failed to send verification email: ' . $e->getMessage());
                }

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
            try {
                Log::info('Resending verification code: ' . $verificationCode . ' to email: ' . $user->email);
                Mail::to($user->email)->send(new VerificationCode($verificationCode));
                Log::info('Verification email resent successfully');
            } catch (\Exception $e) {
                Log::error('Failed to resend verification email: ' . $e->getMessage());
                throw new \Exception('Failed to resend verification email: ' . $e->getMessage());
            }

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

        return response()->json([
            'message' => 'Login successful',
            'user' => $user->only(['id', 'email', 'role']),
            'token' => $token,
            'role' => $role,
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
