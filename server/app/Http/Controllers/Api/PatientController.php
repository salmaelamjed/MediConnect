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
     * Display a listing of the patients.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Build query with optional filters
        $query = Patient::with('user')->latest();

        // Search by name or email (from related user)
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })->orWhere('name', 'like', "%{$search}%");
        }

        // Filter by gender
        if ($request->has('gender')) {
            $query->where('gender', $request->input('gender'));
        }

        // Paginate results
        $patients = $query->paginate($request->input('per_page', 15));

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
     * Creates a related User (role: patient) if not provided.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // User fields (optional user_id or create new user)
            'user_id' => ['nullable', 'exists:users,id', Rule::unique('patients')->ignore(null)],
            'email' => ['required_if:user_id,null', 'email', 'unique:users,email', 'max:255'],
            'password' => ['required_if:user_id,null', 'string', 'min:8', 'confirmed'],
            'name' => ['sometimes', 'string', 'max:255'], // Optional override for user name

            // Patient-specific fields
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
                $user = User::create([
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'role' => 'patient',
                    'name' => $request->input('name', $request->name),
                    'is_active' => true,
                ]);
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
                'message' => 'Patient created successfully.',
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
            if ($request->hasAny(['email', 'password', 'name'])) {
                $userData = [
                    'email' => $request->email,
                    'name' => $request->input('name', $patient->name),
                ];
                if ($request->filled('password')) {
                    $userData['password'] = Hash::make($request->password);
                }
                $patient->user->update($userData);
            }

            $patient->update($request->only([
                'profile', 'date_of_birth', 'gender', 'address', 'city',
                'code_postal', 'medical_history', 'allergies', 'name'
            ]));

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