<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\VerificationCode;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Register a new user and send verification code
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
            'role' => 'required|in:admin,doctor,patient',
            'name' => $request->role === 'doctor' || $request->role === 'patient' ? 'required|string' : 'nullable|string',
            'license_number' => $request->role === 'doctor' ? 'required|string|unique:doctors,license_number' : 'nullable|string',
            'bio' => $request->role === 'doctor' ? 'nullable|string' : 'nullable|string',
            'cabinet_name' => $request->role === 'doctor' ? 'required|string' : 'nullable|string',
            'cabinet_address' => $request->role === 'doctor' ? 'required|string' : 'nullable|string',
            'cabinet_city' => $request->role === 'doctor' ? 'required|string' : 'nullable|string',
            'cabinet_postal_code' => $request->role === 'doctor' ? 'required|string' : 'nullable|string',
            'latitude' => $request->role === 'doctor' ? 'required|numeric|between:-90,90' : 'nullable|numeric',
            'longitude' => $request->role === 'doctor' ? 'required|numeric|between:-180,180' : 'nullable|numeric',
            'consultation_fees' => $request->role === 'doctor' ? 'required|string' : 'nullable|string',
            'date_of_birth' => $request->role === 'patient' ? 'required|date' : 'nullable|date',
            'gender' => $request->role === 'patient' ? 'required|in:Female,Male' : 'nullable|in:Female,Male',
            'address' => $request->role === 'patient' ? 'required|string' : 'nullable|string',
            'city' => $request->role === 'patient' ? 'required|string' : 'nullable|string',
            'code_postal' => $request->role === 'patient' ? 'required|string' : 'nullable|string',
            'medical_history' => $request->role === 'patient' ? 'required|string' : 'nullable|string',
            'allergies' => $request->role === 'patient' ? 'required|string' : 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                // Generate 6-digit verification code
                $verificationCode = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);

                $user = User::create([
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'role' => $request->role,
                    'is_active' => false,
                    'verification_code' => $verificationCode,
                    'verification_code_expires_at' => now()->addHours(24), // Code expires in 24 hours
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
                    Doctor::create([
                        'user_id' => $user->id,
                        'name' => $request->name,
                        'license_number' => $request->license_number,
                        'bio' => $request->bio,
                        'cabinet_name' => $request->cabinet_name,
                        'cabinet_address' => $request->cabinet_address,
                        'cabinet_city' => $request->cabinet_city,
                        'cabinet_postal_code' => $request->cabinet_postal_code,
                        'latitude' => $request->latitude,
                        'longitude' => $request->longitude,
                        'consultation_fees' => $request->consultation_fees,
                    ]);
                }

                // Send verification email
                try {
                    // Log the code being sent for debugging
                    Log::info('Sending verification code: ' . $verificationCode . ' to email: ' . $user->email);

                    $mail = new VerificationCode($verificationCode);
                    Mail::to($user->email)->send($mail);

                    Log::info('Verification email sent successfully');
                } catch (\Exception $e) {
                    Log::error('Failed to send verification email: ' . $e->getMessage());
                    throw new \Exception('Failed to send verification email: ' . $e->getMessage());
                }

                return response()->json([
                    'message' => 'User registered successfully. Please check your email for verification code.',
                    'user' => $user->only(['id', 'email', 'role']),
                    // Remove debug_code in production
                    'debug_code' => config('app.debug') ? $verificationCode : null,
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Registration failed',
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
        $role=$user->role;
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
             'role'=>$role,
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
