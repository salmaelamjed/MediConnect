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
use Illuminate\Support\Facades\Log;
use App\Models\Doctor;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use App\Models\Schedule;

class StaffController extends Controller
{
    /**
     * Display a listing of the staff members.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Get the authenticated user
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non authentifié',
                'error' => 'AuthenticationException'
            ], 401);
        }

        // Get the IDs of cabinets owned by the authenticated user
        $ownedCabinetIds = Cabinet::where('owner_id', $user->id)->pluck('id')->toArray();

        if (empty($ownedCabinetIds)) {
            return response()->json([
                'success' => true,
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $request->input('per_page', 15),
                'total' => 0,
                'from' => 0,
                'to' => 0,
                'message' => 'Aucun cabinet trouvé pour cet utilisateur.',
            ], 200);
        }

        // Build query with optional filters, restricted to owned cabinets
        $query = Staff::with(['user', 'cabinet'])
            ->whereIn('cabinet_id', $ownedCabinetIds)
            ->latest();

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

        // Filter by cabinet_id, but only allow cabinets owned by the user
        if ($request->has('cabinet_id')) {
            $cabinetId = $request->input('cabinet_id');
            if (!in_array($cabinetId, $ownedCabinetIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cabinet non trouvé ou vous n\'êtes pas le propriétaire',
                    'error' => 'Accès non autorisé'
                ], 403);
            }
            $query->where('cabinet_id', $cabinetId);
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
    public function store(Request $request, int $cabinetId)
    {
        try {
            // Vérifier si l'utilisateur authentifié est le propriétaire du cabinet
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié',
                    'error' => 'Authentification requise'
                ], 401);
            }

            $cabinet = Cabinet::where('id', $cabinetId)
                ->where('owner_id', $user->id)
                ->first();

            if (!$cabinet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cabinet non trouvé ou vous n\'êtes pas le propriétaire',
                    'error' => 'Accès non autorisé'
                ], 403);
            }

            // Validation des données d'entrée (incluant les champs pour créer un nouvel utilisateur)
            $validated = $request->validate([
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
                'name' => 'required|string|max:255',
                'speciality_id' => 'required|exists:specialities,id',
                'license_number' => 'required|string|unique:doctors,license_number',
                'bio' => 'nullable|string',
                'consultation_fees' => 'nullable|numeric|min:0',
                'start_time' => 'nullable|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i',
                'available_days' => 'nullable|array',
                'available_days.*' => 'string|in:lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche',
                'profile_image' => 'nullable|string|max:255'
            ]);

            // Démarrer une transaction pour assurer l'intégrité
            DB::beginTransaction();

            // Créer le nouvel utilisateur avec rôle 'doctor'
            $doctorUser = User::create([
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'name' => $validated['name'],
                'role' => 'doctor',
                'is_active' => true,
                'profile_image' => $validated['profile_image'] ?? null,
            ]);

            // Créer l'entrée du médecin
            $doctor = Doctor::create([
                'user_id' => $doctorUser->id,
                'speciality_id' => $validated['speciality_id'],
                'cabinet_id' => $cabinetId,
                'name' => $validated['name'],
                'license_number' => $validated['license_number'],
                'bio' => $validated['bio'] ?? null,
                'consultation_fees' => $validated['consultation_fees'] ?? null,
                'start_time' => $validated['start_time'] ?? null,
                'end_time' => $validated['end_time'] ?? null,
                'available_days' => $validated['available_days'] ,
                'is_active' => true,
            ]);

            // Ajouter le médecin comme membre du personnel
            $staff = Staff::create([
                'user_id' => $doctorUser->id,
                'cabinet_id' => $cabinetId,
                'name' => $validated['name'],
                'job_title' => 'Médecin',
                'phone_number' => null,
                'bio' => $validated['bio'] ?? null,
                'working_days' => $validated['available_days'],
                'start_time' => $validated['start_time'] ?? null,
                'end_time' => $validated['end_time'] ?? null,
                'is_active' => true,
                'is_owner' => false
            ]);

            // Mettre à jour ou créer l'entrée du personnel pour le propriétaire
            $ownerStaff = Staff::updateOrCreate(
                ['user_id' => $user->id, 'cabinet_id' => $cabinetId],
                [
                    'name' => $user->name ?? 'Propriétaire',
                    'job_title' => 'Propriétaire',
                    'phone_number' => null,
                    'bio' => null,
                    'working_days' => is_array($cabinet->working_days) ? json_encode($cabinet->working_days, JSON_UNESCAPED_SLASHES) : $cabinet->working_days,
                    'start_time' => $cabinet->opening_time,
                    'end_time' => $cabinet->closing_time,
                    'is_active' => true,
                    'is_owner' => true
                ]
            );

            // Créer les schedules pour le médecin
            if ($validated['available_days']) {
                foreach ($validated['available_days'] as $day) {
                    Schedule::create([
                        'doctor_id' => $doctor->id,
                        'cabinet_id' => $cabinetId,
                        'day_of_week' => $this->translateDay($day),
                        'start_time' => $validated['start_time'] ?? '09:00',
                        'end_time' => $validated['end_time'] ?? '17:00',
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
            }

            DB::commit();

            // Log de l'action
            Log::info('Médecin ajouté au cabinet avec succès (nouvel utilisateur créé)', [
                'cabinet_id' => $cabinetId,
                'doctor_id' => $doctor->id,
                'user_id' => $doctorUser->id,
                'staff_id' => $staff->id,
                'owner_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Médecin ajouté au cabinet avec succès (nouvel utilisateur créé)',
                'data' => [
                    'user' => [
                        'id' => $doctorUser->id,
                        'email' => $doctorUser->email,
                        'name' => $doctorUser->name,
                        'role' => $doctorUser->role
                    ],
                    'doctor' => [
                        'id' => $doctor->id,
                        'user_id' => $doctor->user_id,
                        'speciality_id' => $doctor->speciality_id,
                        'cabinet_id' => $doctor->cabinet_id,
                        'name' => $doctor->name,
                        'license_number' => $doctor->license_number,
                        'bio' => $doctor->bio,
                        'consultation_fees' => $doctor->consultation_fees,
                        'start_time' => $doctor->start_time,
                        'end_time' => $doctor->end_time,
                        'available_days' => $doctor->available_days ,
                        'is_active' => $doctor->is_active,
                    ],
                    'staff' => [
                        'id' => $staff->id,
                        'user_id' => $staff->user_id,
                        'cabinet_id' => $staff->cabinet_id,
                        'name' => $staff->name,
                        'job_title' => $staff->job_title,
                        'is_owner' => $staff->is_owner
                    ],
                    'owner_staff' => [
                        'id' => $ownerStaff->id,
                        'user_id' => $ownerStaff->user_id,
                        'cabinet_id' => $ownerStaff->cabinet_id,
                        'name' => $ownerStaff->name,
                        'job_title' => $ownerStaff->job_title,
                        'is_owner' => $ownerStaff->is_owner
                    ]
                ]
            ], 201);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'error' => $e->errors()
            ], 422);
        } catch (QueryException $e) {
            DB::rollBack();
            Log::error('Erreur de base de données lors de l\'ajout du médecin: ' . $e->getMessage(), [
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout du médecin',
                'error' => 'Erreur de base de données'
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur inattendue dans addDoctorToCabinet: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Une erreur inattendue s\'est produite',
                'error' => 'Erreur serveur'
            ], 500);
        }
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
            'profile_image' => ['nullable', 'string', 'max:255'],
            // Staff fields
            'cabinet_id' => ['sometimes', 'required', 'exists:cabinets,id'],
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
}
