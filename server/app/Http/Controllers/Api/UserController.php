<?php

namespace App\Http\Controllers\Api;

use App\Models\Patient;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    /**
     * Return all users (Admin only).
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        // Check if the authenticated user is an admin
        if (!Auth::user() || Auth::user()->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only admins can view all users.',
            ], 403);
        }

        // Retrieve all users
        $users = User::select('id', 'email', 'role', 'is_active', 'profile_image', 'created_at', 'updated_at')
            ->get();

        return response()->json([
            'message' => 'Users retrieved successfully.',
            'data' => $users,
        ], 200);
    }

   /**
     * Show details of the authenticated user.
     *
     * @return JsonResponse
     */
    public function show(): JsonResponse
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'User not authenticated.',
            ], 401);
        }

        // Base user data
        $userData = [
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => $user->is_active,
            'profile_image' => $user->profile_image,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];

        // If the user is a patient, include additional patient details and reservations
        if ($user->role === 'patient') {
            // Fetch patient details
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                return response()->json([
                    'message' => 'Patient profile not found for this user.',
                ], 404);
            }

            // Fetch reservation history
            $reservations = Reservation::where('patient_id', $patient->id)
                ->select('id', 'reservation_date', 'reservation_time', 'status', 'reason', 'created_at', 'updated_at')
                ->get();

            // Add patient-specific data to the response
            $userData['patient_details'] = [
                'name' => $patient->name,
                'profile' => $patient->profile,
                'allergies' => $patient->allergies,
                'medical_history' => $patient->medical_history,
                'date_of_birth' => $patient->date_of_birth,
                'gender' => $patient->gender,
                'address' => $patient->address,
                'city' => $patient->city,
                'code_postal' => $patient->code_postal,
                'reservations' => $reservations,
            ];
        }

        return response()->json([
            'message' => 'User details retrieved successfully.',
            'data' => $userData,
        ], 200);
    }
    /**
     * Update the authenticated user's data.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function update(Request $request): JsonResponse
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'User not authenticated.',
            ], 401);
        }

        // Validate the request
        $validator = Validator::make($request->all(), [
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|min:8|confirmed',
            'profile_image' => 'sometimes|url|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Update user data
            if ($request->has('email')) {
                $user->email = $request->input('email');
            }

            if ($request->has('password')) {
                $user->password = Hash::make($request->input('password'));
            }

            if ($request->has('profile_image')) {
                $user->profile_image = $request->input('profile_image');
            }

            $user->save();

            return response()->json([
                'message' => 'User data updated successfully.',
                'data' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'profile_image' => $user->profile_image,
                    'updated_at' => $user->updated_at,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating user: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while updating the user.',
            ], 500);
        }
    }

    /**
     * Update a user's role (Admin only).
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateRole(Request $request, $id): JsonResponse
    {
        // Check if the authenticated user is an admin
        if (!Auth::user() || Auth::user()->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only admins can update user roles.',
            ], 403);
        }

        // Validate the request
        $validator = Validator::make($request->all(), [
            'role' => 'required|in:admin,doctor,patient,staff',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Find the user to update
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        try {
            // Update the user's role
            $user->role = $request->input('role');
            $user->save();

            return response()->json([
                'message' => 'User role updated successfully.',
                'data' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'updated_at' => $user->updated_at,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating user role: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while updating the user role.',
            ], 500);
        }
    }

    /**
     * Delete a user (Admin only).
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        // Check if the authenticated user is an admin
        if (!Auth::user() || Auth::user()->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only admins can delete users.',
            ], 403);
        }

        // Find the user to delete
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        // Prevent admin from deleting themselves
        if ($user->id === Auth::user()->id) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 403);
        }

        try {
            // Delete the user (cascades to related tables like patients, doctors, etc.)
            $user->delete();

            return response()->json([
                'message' => 'User deleted successfully.',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting user: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while deleting the user.',
            ], 500);
        }
    }
}
