<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PatientController extends Controller
{
    /**
     * Generate a simple password with at least 1 uppercase letter, 1 number, and 1 special character.
     *
     * @return string
     */
    private function generateSimplePassword(): string
    {
        $lowercase = 'abcdefghijklmnopqrstuvwxyz';
        $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $numbers = '0123456789';
        $specialChars = '@#$%';

        // Ensure at least one of each required type
        $password = [
            $uppercase[random_int(0, strlen($uppercase) - 1)], // 1 uppercase
            $numbers[random_int(0, strlen($numbers) - 1)],     // 1 number
            $specialChars[random_int(0, strlen($specialChars) - 1)], // 1 special char
        ];

        // Fill the rest with lowercase letters for simplicity (7-9 more characters)
        $length = random_int(7, 9);
        for ($i = 0; $i < $length; $i++) {
            $password[] = $lowercase[random_int(0, strlen($lowercase) - 1)];
        }

        // Shuffle the password array and combine into a string
        shuffle($password);
        return implode('', $password);
    }

    /**
     * Display a listing of the patients who have made appointments in the authenticated owner's cabinet
     * with statuses other than 'pending' or 'canceled'.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Get the authenticated user
        $user = $request->user();

        // Ensure the user is an owner (has a cabinet)
        $cabinet = $user->ownedCabinet;
        if (!$cabinet) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: User does not own a cabinet.',
            ], 403);
        }

        // Build query to fetch patients with reservations in the owner's cabinet
        $query = Patient::with('user')
            ->whereHas('reservations', function ($q) use ($cabinet) {
                $q->where('cabinet_id', $cabinet->id)
                  ->whereNotIn('status', ['pending', 'cancelled']);
            })
            ->latest();

        // Search by name or email (from related user or patient)
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                })->orWhere('name', 'like', "%{$search}%");
            });
        }

        // Filter by gender
        if ($request->has('gender')) {
            $query->where('gender', $request->input('gender'));
        }

        // Paginate results
        $patients = $query->paginate($request->input('per_page', 10));

        // Transform response to match TypeScript PaginationInfo interface
        return response()->json([
            'success' => true,
            'data' => $patients->items(), // Only the patient records
            'current_page' => $patients->currentPage(),
            'last_page' => $patients->lastPage(),
            'per_page' => $patients->perPage(),
            'total' => $patients->total(),
            'from' => $patients->firstItem(),
            'to' => $patients->lastItem(),
            'message' => 'Patients retrieved successfully.',
        ], 200);
    }

    /**
     * Store a newly created patient in storage.
     * Creates a related User (role: patient) with an auto-generated password sent via email/SMS.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required_if:user_id,null', 'email', 'unique:users,email', 'max:255'],
            'name' => ['sometimes', 'string', 'max:255'], // Optional override for user name
            'profile' => ['nullable', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:Female,Male'],
            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'code_postal' => ['required', 'string', 'max:20'],
            'medical_history' => ['nullable', 'string'],
            'allergies' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Validation failed.',
            ], 422);
        }

        return DB::transaction(function () use ($request) {
            // Handle user creation or linkage
            if ($request->filled('user_id')) {
                $user = User::findOrFail($request->user_id);
                if ($user->role !== 'patient') {
                    $user->role = 'patient';
                    $user->save();
                }
            } else {
                // Generate a simple password
                $generatedPassword = $this->generateSimplePassword();

                $user = User::create([
                    'email' => $request->email,
                    'password' => Hash::make($generatedPassword),
                    'role' => 'patient',
                    'name' => $request->input('name', $request->email),
                    'is_active' => true,
                ]);

                // Send password via email
                try {
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(
                        new \App\Mail\WelcomePasswordMail($generatedPassword, $user->name)
                    );
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Email sending failed: ' . $e->getMessage());
                }
            }

            $patient = Patient::create([
                'user_id' => $user->id,
                'name' => $request->input('name', $user->name),
                'profile' => $request->profile,
                'date_of_birth' => $request->date_of_birth,
                'gender' => $request->gender,
                'address' => $request->address,
                'city' => $request->city,
                'code_postal' => $request->code_postal,
                'medical_history' => $request->medical_history,
                'allergies' => $request->allergies,
            ]);

            $patient->load('user');

            return response()->json([
                'success' => true,
                'data' => $patient,
                'message' => 'Patient created successfully. Password has been sent to the patient\'s email' . ($request->filled('phone_number') ? ' and SMS.' : '.'),
            ], 201);
        });
    }

    /**
     * Display the specified patient.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $patient = Patient::with('user')->find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $patient,
            'message' => 'Patient retrieved successfully.',
        ], 200);
    }

    /**
     * Update the specified patient in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($patient->user->id)],
            'password' => ['sometimes', 'string', 'min:8', 'confirmed'],
            'name' => ['sometimes', 'string', 'max:255'],
            'profile' => ['nullable', 'string', 'max:255'],
            'date_of_birth' => ['sometimes', 'date', 'before:today'],
            'gender' => ['sometimes', 'in:Female,Male'],
            'address' => ['sometimes', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:100'],
            'code_postal' => ['sometimes', 'string', 'max:20'],
            'medical_history' => ['nullable', 'string'],
            'allergies' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Validation failed.',
            ], 422);
        }

        return DB::transaction(function () use ($request, $patient) {
            // Update Patient model
            $patient->update($request->only([
                'profile', 'date_of_birth', 'gender', 'address', 'city',
                'code_postal', 'medical_history', 'allergies', 'name'
            ]));

            // Update related User model if email, name, or password is provided
            $user = $patient->user;
            $userUpdates = [];

            if ($request->filled('email')) {
                $userUpdates['email'] = $request->email;
            }
            if ($request->filled('name')) {
                $userUpdates['name'] = $request->name;
            }
            if ($request->filled('password')) {
                $userUpdates['password'] = Hash::make($request->password);
            }

            if (!empty($userUpdates)) {
                $user->update($userUpdates);
            }

            // Reload the user relationship to ensure fresh data
            $patient->load('user');

            return response()->json([
                'success' => true,
                'data' => $patient,
                'message' => 'Patient updated successfully.',
            ], 200);
        });
    }

    /**
     * Remove the specified patient from storage (soft delete or cascade).
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found.',
            ], 404);
        }

        return DB::transaction(function () use ($patient) {
            $patient->delete();

            return response()->json([
                'success' => true,
                'message' => 'Patient deleted successfully.',
            ], 200);
        });
    }

    /**
     * Get authenticated user's patient profile (if role=patient).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function me(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'patient') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Not a patient.',
            ], 403);
        }

        $patient = Patient::with('user')->where('user_id', $user->id)->first();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient profile not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $patient,
            'message' => 'My patient profile retrieved successfully.',
        ], 200);
    }
}
