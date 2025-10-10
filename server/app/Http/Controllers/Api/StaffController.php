<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\User;
use App\Models\Cabinet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    /**
     * Display a listing of the staff members.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Build query with optional filters
        $query = Staff::with(['user', 'cabinet'])->latest();

        // Search by name, email (from user), or job title
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })->orWhere('name', 'like', "%{$search}%")
              ->orWhere('job_title', 'like', "%{$search}%");
        }

        // Filter by job title
        if ($request->has('job_title')) {
            $query->where('job_title', $request->input('job_title'));
        }

        // Filter by cabinet_id
        if ($request->has('cabinet_id')) {
            $query->where('cabinet_id', $request->input('cabinet_id'));
        }

        // Paginate results
        $staff = $query->paginate($request->input('per_page', 15));

        // Transform response to match PaginationInfo interface
        return response()->json([
            'success' => true,
            'data' => $staff->items(),
            'current_page' => $staff->currentPage(),
            'last_page' => $staff->lastPage(),
            'per_page' => $staff->perPage(),
            'total' => $staff->total(),
            'from' => $staff->firstItem(),
            'to' => $staff->lastItem(),
            'message' => 'Staff members retrieved successfully.',
        ], 200);
    }

    /**
     * Store a newly created staff member in storage.
     * Creates a related User (role: staff) if not provided.
     * Restricted to users who own the specified cabinet.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Validate request
        $validator = Validator::make($request->all(), [
            // User fields (optional user_id or create new user)
            'user_id' => ['nullable', 'exists:users,id', Rule::unique('staff')->ignore(null)],
            'email' => ['required_if:user_id,null', 'email', 'unique:users,email', 'max:255'],
            'password' => ['required_if:user_id,null', 'string', 'min:8', 'confirmed'],
            'name' => ['sometimes', 'string', 'max:255'], // Optional override for user name

            // Staff-specific fields
            'cabinet_id' => ['required', 'exists:cabinets,id'], // Changed to required
            'job_title' => ['required', 'string', 'max:100'],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'bio' => ['nullable', 'string'],
            'working_days' => ['nullable', 'array', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'start_time' => ['nullable', 'date_format:H:i:s'],
            'end_time' => ['nullable', 'date_format:H:i:s', 'after:start_time'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Validation failed.',
            ], 422);
        }

        // Check if authenticated user owns the specified cabinet
        $user = $request->user();
        $cabinet = Cabinet::where('id', $request->cabinet_id)
                         ->where('owner_id', $user->id)
                         ->first();

        if (!$cabinet) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You are not the owner of this cabinet.',
            ], 403);
        }

        return DB::transaction(function () use ($request, $user) {
            // Handle user creation or linkage
            if ($request->filled('user_id')) {
                $staffUser = User::findOrFail($request->user_id);
                if ($staffUser->role !== 'staff') {
                    $staffUser->role = 'staff';
                    $staffUser->save();
                }
            } else {
                $staffUser = User::create([
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'role' => 'staff',
                    'name' => $request->input('name', $request->name),
                    'is_active' => true,
                ]);
            }

            $staff = Staff::create([
                'user_id' => $staffUser->id,
                'cabinet_id' => $request->cabinet_id,
                'name' => $request->input('name', $staffUser->name),
                'job_title' => $request->job_title,
                'phone_number' => $request->phone_number,
                'bio' => $request->bio,
                'working_days' => $request->working_days,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'is_active' => $request->input('is_active', true),
            ]);

            $staff->load(['user', 'cabinet']);

            return response()->json([
                'success' => true,
                'data' => $staff,
                'message' => 'Staff member created successfully.',
            ], 201);
        });
    }

    /**
     * Display the specified staff member.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $staff = Staff::with(['user', 'cabinet'])->find($id);

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Staff member not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $staff,
            'message' => 'Staff member retrieved successfully.',
        ], 200);
    }

    /**
     * Update the specified staff member in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $staff = Staff::find($id);

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Staff member not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            // User-related updates (optional)
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($staff->user->id)],
            'password' => ['sometimes', 'string', 'min:8', 'confirmed'],
            'name' => ['sometimes', 'string', 'max:255'],
             'profile_image'=>['nullable','string','max:255'],
            // Staff fields
            'cabinet_id' => ['sometimes', 'required', 'exists:cabinets,id'], // Changed to required
            'job_title' => ['sometimes', 'string', 'max:100'],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'bio' => ['nullable', 'string'],
            'working_days' => ['nullable', 'array', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'start_time' => ['nullable', 'date_format:H:i:s'],
            'end_time' => ['nullable', 'date_format:H:i:s', 'after:start_time'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'Validation failed.',
            ], 422);
        }

        return DB::transaction(function () use ($request, $staff) {
            // Update related user if fields provided
            if ($request->hasAny(['email', 'password', 'name'])) {
                $userData = [
                    'email' => $request->email,
                    'name' => $request->input('name', $staff->name),
                ];
                if ($request->filled('password')) {
                    $userData['password'] = Hash::make($request->password);
                }
                $staff->user->update($userData);
            }

            // Update staff fields
            $staff->update($request->only([
                'cabinet_id',
                'name',
                'job_title',
                'phone_number',
                'bio',
                'working_days',
                'start_time',
                'end_time',
                'is_active',
            ]));

            $staff->load(['user', 'cabinet']);

            return response()->json([
                'success' => true,
                'data' => $staff,
                'message' => 'Staff member updated successfully.',
            ], 200);
        });
    }

    /**
     * Remove the specified staff member from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $staff = Staff::find($id);

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Staff member not found.',
            ], 404);
        }

        return DB::transaction(function () use ($staff) {
            // Cascade: deletes related user due to onDelete('cascade') on user_id
            $staff->delete();

            return response()->json([
                'success' => true,
                'message' => 'Staff member deleted successfully.',
            ], 200);
        });
    }

    /**
     * Get authenticated user's staff profile (if role=staff).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function me(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'staff') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Not a staff member.',
            ], 403);
        }

        $staff = Staff::with(['user', 'cabinet'])->where('user_id', $user->id)->first();

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Staff profile not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $staff,
            'message' => 'My staff profile retrieved successfully.',
        ], 200);
    }
}