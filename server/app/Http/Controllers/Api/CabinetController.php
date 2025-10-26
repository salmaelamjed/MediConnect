<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cabinet;
use App\Models\Doctor;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\QueryException;

class CabinetController extends Controller
{
     /**
     * Ajouter un médecin à un cabinet
     *
     * @param Request $request
     * @param int $cabinetId
     * @return JsonResponse
     *//**
 * Ajouter un médecin à un cabinet (avec création d'un nouvel utilisateur médecin)
 *
 * @param Request $request
 * @param int $cabinetId
 * @return JsonResponse
 */
public function addDoctorToCabinet(Request $request, int $cabinetId): JsonResponse
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
            'password' => 'required|string|min:8|confirmed', // Ajout de 'password_confirmation' dans la requête
            'name' => 'required|string|max:255', // Nom de l'utilisateur/médecin
            'speciality_id' => 'required|exists:specialities,id',
            'license_number' => 'required|string|unique:doctors,license_number',
            'bio' => 'nullable|string',
            'consultation_fees' => 'nullable|numeric|min:0',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'available_days' => 'nullable|array',
            'available_days.*' => 'string|in:lundi,mardi,mercredi,jeudi,vendredi,samedi,dimanche',
            'profile_image' => 'nullable|string|max:255' // Optionnel pour l'image de profil
        ]);

        // Démarrer une transaction pour assurer l'intégrité (création user + doctor + staff)
        DB::beginTransaction();

        // Créer le nouvel utilisateur avec rôle 'doctor'
        $doctorUser = User::create([
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'name' => $validated['name'], // Assumer que 'name' est stocké dans users si le champ existe, sinon ajuster
            'role' => 'doctor',
            'is_active' => true,
            'profile_image' => $validated['profile_image'] ?? null,
            // Ajouter d'autres champs users si nécessaire (ex: email_verified_at si auto-vérifié)
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
            'available_days' => $validated['available_days'] ? json_encode($validated['available_days']) : null,
            'is_active' => true,
        ]);

        // Ajouter le médecin comme membre du personnel
        $staff = Staff::create([
            'user_id' => $doctorUser->id,
            'cabinet_id' => $cabinetId,
            'name' => $validated['name'],
            'job_title' => 'Médecin',
            'phone_number' => null, // Optionnel, peut être ajouté dans validation si besoin
            'bio' => $validated['bio'] ?? null,
            'working_days' => $validated['available_days'] ? json_encode($validated['available_days']) : null,
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'is_active' => true,
            'is_owner' => false // Le médecin ajouté n'est pas le propriétaire
        ]);

        // Mettre à jour ou créer l'entrée du personnel pour le propriétaire
        $ownerStaff = Staff::updateOrCreate(
            [
                'user_id' => $user->id,
                'cabinet_id' => $cabinetId
            ],
            [
                'name' => $user->name ?? 'Propriétaire',
                'job_title' => 'Propriétaire',
                'phone_number' => null,
                'bio' => null,
                'working_days' => $cabinet->working_days,
                'start_time' => $cabinet->opening_time,
                'end_time' => $cabinet->closing_time,
                'is_active' => true,
                'is_owner' => true // Marquer explicitement comme propriétaire
            ]
        );

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
                    'available_days' => $doctor->available_days,
                    'is_active' => $doctor->is_active
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
     * Récupérer tous les cabinets actifs
     *
     * @return JsonResponse
     */
public function allCabinetsActive(): JsonResponse
{
    try {
        // Vérifier la connexion à la base de données
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            Log::error('Connexion à la base de données échouée: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Impossible de se connecter à la base de données',
                'error' => 'Erreur de connexion'
            ], 500);
        }

        $cabinets = Cabinet::select(
            'cabinets.id',
            'cabinets.owner_id',
            'cabinets.name',
            'cabinets.description',
            'cabinets.image',
            'cabinets.detail_images',
            'cabinets.address',
            'cabinets.city',
            'cabinets.postal_code',
            'cabinets.email',
            'cabinets.opening_time',
            'cabinets.closing_time',
            'cabinets.working_days',
            'cabinets.latitude',
            'cabinets.longitude',
            'cabinets.is_active',
            'cabinets.created_at',
            'cabinets.updated_at',
            'doctors.name as owner_name',
            'users.email as owner_email'
        )
        ->where('cabinets.is_active', true)
        ->leftJoin('users', 'cabinets.owner_id', '=', 'users.id')
        ->leftJoin('doctors', 'users.id', '=', 'doctors.user_id')
        ->with([
    'specialities' => function ($query) {
        $query->select('specialities.name');
    },
    'doctors' => function ($query) {
        $query->select('id', 'user_id', 'cabinet_id', 'name', 'license_number', 'bio', 'consultation_fees', 'start_time', 'end_time', 'available_days');
    }
     ])
        ->get();

        // Transformer les specialities en tableau de noms et traiter les images
        $cabinets = $cabinets->map(function ($cabinet) {
            $cabinet->specialities = $cabinet->specialities->pluck('name')->toArray();

            // S'assurer que detail_images est un tableau
            if (is_string($cabinet->detail_images)) {
                $cabinet->detail_images = json_decode($cabinet->detail_images, true) ?? [];
            } else if (is_null($cabinet->detail_images)) {
                $cabinet->detail_images = [];
            }

            return $cabinet;
        });

        // Vérifier si des cabinets ont été trouvés
        if ($cabinets->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [],
                'message' => 'Aucun cabinet actif trouvé',
                'count' => 0
            ], 200);
        }

        return response()->json([
            'success' => true,
            'data' => $cabinets,
            'message' => 'Cabinets actifs récupérés avec succès',
            'count' => $cabinets->count()
        ], 200);

    } catch (QueryException $e) {
        Log::error('Erreur de base de données dans allCabinetsActive: ' . $e->getMessage(), [
            'sql' => $e->getSql(),
            'bindings' => $e->getBindings()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la récupération des cabinets actifs',
            'error' => 'Erreur de base de données: ' . $e->getMessage()
        ], 500);

    } catch (\Exception $e) {
        Log::error('Erreur inattendue dans allCabinetsActive: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Une erreur inattendue s\'est produite',
            'error' => 'Erreur serveur: ' . $e->getMessage()
        ], 500);
    }
}
      /**
     * Récupérer tous les cabinets
     *
     * @return JsonResponse
     */
    public function allCabinets(): JsonResponse
    {
        try {
            $cabinets = Cabinet::select([
                'id',
                'owner_id',
                'name',
                'description',
                'image',
                'detail_images',
                'address',
                'city',
                'postal_code',
                'email',
                'opening_time',
                'closing_time',
                'working_days',
                'latitude',
                'longitude',
                'is_active',
                'created_at',
                'updated_at'
            ])->get();

            // Traiter les images détaillées
            $cabinets = $cabinets->map(function ($cabinet) {
                // S'assurer que detail_images est un tableau
                if (is_string($cabinet->detail_images)) {
                    $cabinet->detail_images = json_decode($cabinet->detail_images, true) ?? [];
                } else if (is_null($cabinet->detail_images)) {
                    $cabinet->detail_images = [];
                }

                return $cabinet;
            });

            return response()->json([
                'success' => true,
                'data' => $cabinets,
                'message' => 'Tous les cabinets récupérés avec succès',
                'count' => $cabinets->count()
            ], 200);

        } catch (QueryException $e) {
            Log::error('Erreur base de données lors de la récupération de tous les cabinets: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des cabinets',
                'error' => 'Erreur de base de données'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Erreur inattendue dans allCabinets: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Une erreur inattendue s\'est produite',
                'error' => 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * Récupérer un cabinet par nom
     *
     * @param Request $request
     * @param string $name
     * @return JsonResponse
     */
    public function getCabinetByName(Request $request, string $name): JsonResponse
    {
        try {
            // Validation du paramètre
            if (empty(trim($name))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le nom du cabinet ne peut pas être vide',
                    'error' => 'Paramètre invalide'
                ], 400);
            }

            // Recherche avec la syntaxe correcte pour LIKE
            $cabinets = Cabinet::select([
                'id',
                'owner_id',
                'name',
                'description',
                'image',
                'detail_images',
                'address',
                'city',
                'postal_code',
                'email',
                'opening_time',
                'closing_time',
                'working_days',
                'latitude',
                'longitude',
                'is_active',
                'created_at',
                'updated_at'
            ])->where('name', 'like', '%' . $name . '%')->get();

            if ($cabinets->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun cabinet trouvé avec ce nom',
                    'data' => [],
                    'count' => 0
                ], 404);
            }

            // Traiter les images détaillées
            $cabinets = $cabinets->map(function ($cabinet) {
                // S'assurer que detail_images est un tableau
                if (is_string($cabinet->detail_images)) {
                    $cabinet->detail_images = json_decode($cabinet->detail_images, true) ?? [];
                } else if (is_null($cabinet->detail_images)) {
                    $cabinet->detail_images = [];
                }

                return $cabinet;
            });

            // Pour une collection, on ne peut pas accéder directement aux propriétés
            // On prend le premier élément si on veut les coordonnées
            $firstCabinet = $cabinets->first();

            return response()->json([
                'success' => true,
                'data' => $cabinets,
                'latitude' => $firstCabinet->latitude ?? null,
                'longitude' => $firstCabinet->longitude ?? null,
                'count' => $cabinets->count(),
                'message' => 'Cabinets trouvés avec succès'
            ], 200);

        } catch (QueryException $e) {
            Log::error('Erreur base de données lors de la recherche par nom: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche du cabinet',
                'error' => 'Erreur de base de données'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Erreur inattendue dans getCabinetByName: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Une erreur inattendue s\'est produite',
                'error' => 'Erreur serveur'
            ], 500);
        }
    }


/**
 * Récupérer les détails complets d'un cabinet par ID
 *
 * @param int $id
 * @return JsonResponse
 */
/**
 * Récupérer les détails complets d'un cabinet par ID
 *
 * @param int $id
 * @return JsonResponse
 */
public function show(int $id): JsonResponse
{
    try {
        // Validation de l'ID
        if ($id <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'ID invalide',
                'error' => 'Paramètre invalide'
            ], 400);
        }

        // Vérifier la connexion à la base de données
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            Log::error('Connexion à la base de données échouée: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Impossible de se connecter à la base de données',
                'error' => 'Erreur de connexion'
            ], 500);
        }

        // Récupérer le cabinet avec ses relations
        $cabinet = Cabinet::select(
            'cabinets.id',
            'cabinets.owner_id',
            'cabinets.name',
            'cabinets.description',
            'cabinets.image',
            'cabinets.detail_images',
            'cabinets.address',
            'cabinets.city',
            'cabinets.postal_code',
            'cabinets.email',
            'cabinets.opening_time',
            'cabinets.closing_time',
            'cabinets.working_days',
            'cabinets.latitude',
            'cabinets.longitude',
            'cabinets.is_active',
            'cabinets.created_at',
            'cabinets.updated_at',
            'doctors.name as owner_name',
            'users.email as owner_email',
            'users.profile_image as owner_profile_image'
        )
        ->where('cabinets.id', $id)
        ->leftJoin('users', 'cabinets.owner_id', '=', 'users.id')
        ->leftJoin('doctors', 'users.id', '=', 'doctors.user_id')
        ->with([
            // Récupérer toutes les spécialités du cabinet (via tous les médecins)
            'doctors.speciality' => function ($query) {
                $query->select('specialities.id', 'specialities.name', 'specialities.description', 'specialities.icon', 'specialities.is_active')
                      ->distinct(); // Éviter les doublons
            },
            'doctors' => function ($query) {
                $query->select(
                    'doctors.id',
                    'doctors.user_id',
                    'doctors.cabinet_id',
                    'doctors.name',
                    'doctors.license_number',
                    'doctors.bio',
                    'doctors.consultation_fees',
                    'doctors.start_time',
                    'doctors.end_time',
                    'doctors.available_days',
                    'doctors.is_active',
                    'doctors.speciality_id',
                    'users.profile_image as doctor_profile_image'
                )
                ->leftJoin('users', 'doctors.user_id', '=', 'users.id')
                ->where('doctors.is_active', true); // Seulement les médecins actifs
            }
        ])
        ->first();

        // Vérifier si le cabinet existe
        if (!$cabinet) {
            return response()->json([
                'success' => false,
                'message' => 'Cabinet non trouvé',
                'error' => 'Ressource non trouvée'
            ], 404);
        }

        // Récupérer toutes les spécialités uniques du cabinet
        $allSpecialities = collect();
        if ($cabinet->doctors) {
            foreach ($cabinet->doctors as $doctor) {
                if ($doctor->speciality) {
                    $allSpecialities->push($doctor->speciality);
                }
            }
            // Supprimer les doublons basés sur l'ID de spécialité
            $allSpecialities = $allSpecialities->unique('id')->values();
        }

        // Récupérer les cabinets à proximité (dans un rayon de 10km)
        $nearbyRadius = 10; // Rayon en kilomètres
        $nearbyClinics = Cabinet::select(
            'cabinets.id',
            'cabinets.owner_id',
            'cabinets.name',
            'cabinets.description',
            'cabinets.image',
            'cabinets.detail_images',
            'cabinets.address',
            'cabinets.city',
            'cabinets.postal_code',
            'cabinets.email',
            'cabinets.opening_time',
            'cabinets.closing_time',
            'cabinets.working_days',
            'cabinets.latitude',
            'cabinets.longitude',
            'cabinets.is_active',
            'cabinets.created_at',
            'cabinets.updated_at',
            'doctors.name as owner_name',
            'users.email as owner_email',
            'users.profile_image as owner_profile_image'
        )
        ->where('cabinets.id', '!=', $id) // Exclure le cabinet actuel
        ->whereNotNull('cabinets.latitude')
        ->whereNotNull('cabinets.longitude')
        ->where('cabinets.is_active', true)
        ->leftJoin('users', 'cabinets.owner_id', '=', 'users.id')
        ->leftJoin('doctors', 'users.id', '=', 'doctors.user_id')
        ->with([
            'doctors.speciality' => function ($query) {
                $query->select('specialities.id', 'specialities.name', 'specialities.description', 'specialities.icon', 'specialities.is_active')
                      ->distinct();
            },
            'doctors' => function ($query) {
                $query->select(
                    'doctors.id',
                    'doctors.user_id',
                    'doctors.cabinet_id',
                    'doctors.name',
                    'doctors.license_number',
                    'doctors.bio',
                    'doctors.consultation_fees',
                    'doctors.start_time',
                    'doctors.end_time',
                    'doctors.available_days',
                    'doctors.is_active',
                    'doctors.speciality_id',
                    'users.profile_image as doctor_profile_image'
                )
                ->leftJoin('users', 'doctors.user_id', '=', 'users.id')
                ->where('doctors.is_active', true);
            }
        ])
        ->get()
        ->filter(function ($clinic) use ($cabinet, $nearbyRadius) {
            // Calcul de la distance avec la formule Haversine
            if (!$cabinet->latitude || !$cabinet->longitude || !$clinic->latitude || !$clinic->longitude) {
                return false;
            }

            $earthRadius = 6371; // Rayon de la Terre en km
            $latFrom = deg2rad($cabinet->latitude);
            $lonFrom = deg2rad($cabinet->longitude);
            $latTo = deg2rad($clinic->latitude);
            $lonTo = deg2rad($clinic->longitude);

            $latDelta = $latTo - $latFrom;
            $lonDelta = $lonTo - $lonFrom;

            $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
                cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
            $distance = $angle * $earthRadius;

            return $distance <= $nearbyRadius;
        })
        ->map(function ($clinic) {
            // Récupérer toutes les spécialités uniques pour ce cabinet
            $clinicSpecialities = collect();
            if ($clinic->doctors) {
                foreach ($clinic->doctors as $doctor) {
                    if ($doctor->speciality) {
                        $clinicSpecialities->push($doctor->speciality);
                    }
                }
                $clinicSpecialities = $clinicSpecialities->unique('id')->values();
            }

            // Transformer les doctors pour nearby clinics
            $clinicDoctors = $clinic->doctors ? $clinic->doctors->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'user_id' => $doctor->user_id,
                    'cabinet_id' => $doctor->cabinet_id,
                    'name' => $doctor->name,
                    'license_number' => $doctor->license_number,
                    'bio' => $doctor->bio,
                    'consultation_fees' => $doctor->consultation_fees,
                    'start_time' => $doctor->start_time,
                    'end_time' => $doctor->end_time,
                    'available_days' => $doctor->available_days,
                    'is_active' => $doctor->is_active,
                    'speciality_id' => $doctor->speciality_id,
                    'profile_image' => $doctor->doctor_profile_image,
                    'speciality' => $doctor->speciality ? [
                        'id' => $doctor->speciality->id,
                        'name' => $doctor->speciality->name,
                        'description' => $doctor->speciality->description,
                        'icon' => $doctor->speciality->icon,
                        'is_active' => $doctor->speciality->is_active
                    ] : null
                ];
            })->toArray() : [];

            return [
                'id' => $clinic->id,
                'owner_id' => $clinic->owner_id,
                'name' => $clinic->name,
                'description' => $clinic->description,
                'image' => $clinic->image,
                'detail_images' => $clinic->detail_images,
                'address' => $clinic->address,
                'city' => $clinic->city,
                'postal_code' => $clinic->postal_code,
                'email' => $clinic->email,
                'opening_time' => $clinic->opening_time,
                'closing_time' => $clinic->closing_time,
                'working_days' => $clinic->working_days,
                'latitude' => $clinic->latitude,
                'longitude' => $clinic->longitude,
                'is_active' => $clinic->is_active,
                'created_at' => $clinic->created_at,
                'updated_at' => $clinic->updated_at,
                'owner_name' => $clinic->owner_name,
                'owner_email' => $clinic->owner_email,
                'owner_profile_image' => $clinic->owner_profile_image,
                'specialities' => $clinicSpecialities->toArray(),
                'doctors' => $clinicDoctors
            ];
        })->values()->toArray();

        // Transformer les doctors du cabinet principal
        $cabinetDoctors = $cabinet->doctors ? $cabinet->doctors->map(function ($doctor) {
            return [
                'id' => $doctor->id,
                'user_id' => $doctor->user_id,
                'cabinet_id' => $doctor->cabinet_id,
                'name' => $doctor->name,
                'license_number' => $doctor->license_number,
                'bio' => $doctor->bio,
                'consultation_fees' => $doctor->consultation_fees,
                'start_time' => $doctor->start_time,
                'end_time' => $doctor->end_time,
                'available_days' => $doctor->available_days,
                'is_active' => $doctor->is_active,
                'speciality_id' => $doctor->speciality_id,
                'profile_image' => $doctor->doctor_profile_image,
                'speciality' => $doctor->speciality ? [
                    'id' => $doctor->speciality->id,
                    'name' => $doctor->speciality->name,
                    'description' => $doctor->speciality->description,
                    'icon' => $doctor->speciality->icon,
                    'is_active' => $doctor->speciality->is_active
                ] : null
            ];
        })->toArray() : [];

        // Préparer les données de réponse
        $responseData = [
            'id' => $cabinet->id,
            'owner_id' => $cabinet->owner_id,
            'name' => $cabinet->name,
            'description' => $cabinet->description,
            'image' => $cabinet->image,
            'detail_images' => $cabinet->detail_images,
            'address' => $cabinet->address,
            'city' => $cabinet->city,
            'postal_code' => $cabinet->postal_code,
            'email' => $cabinet->email,
            'opening_time' => $cabinet->opening_time,
            'closing_time' => $cabinet->closing_time,
            'working_days' => $cabinet->working_days,
            'latitude' => $cabinet->latitude,
            'longitude' => $cabinet->longitude,
            'is_active' => $cabinet->is_active,
            'created_at' => $cabinet->created_at,
            'updated_at' => $cabinet->updated_at,
            'owner_name' => $cabinet->owner_name,
            'owner_email' => $cabinet->owner_email,
            'owner_profile_image' => $cabinet->owner_profile_image,
            'specialities' => $allSpecialities->toArray(), // Toutes les spécialités uniques
            'doctors' => $cabinetDoctors,
            'nearby_clinics' => $nearbyClinics
        ];

        // Log pour débogage
        Log::info('Cabinet details retrieved', [
            'cabinet_id' => $id,
            'specialities_count' => $allSpecialities->count(),
            'doctors_count' => count($cabinetDoctors),
            'nearby_clinics_count' => count($nearbyClinics)
        ]);

        return response()->json([
            'success' => true,
            'data' => $responseData,
            'message' => 'Détails du cabinet et cabinets à proximité récupérés avec succès'
        ], 200);
    } catch (QueryException $e) {
        Log::error('Erreur de base de données dans show: ' . $e->getMessage(), [
            'sql' => $e->getSql(),
            'bindings' => $e->getBindings()
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la récupération des détails du cabinet',
            'error' => 'Erreur de base de données: ' . $e->getMessage()
        ], 500);
    } catch (\Exception $e) {
        Log::error('Erreur inattendue dans show: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Une erreur inattendue s\'est produite',
            'error' => 'Erreur serveur: ' . $e->getMessage()
        ], 500);
    }
}
    /**
     * Récupérer un cabinet par adresse
     *
     * @param Request $request
     * @param string $address
     * @return JsonResponse
     */
    public function getCabinetByAddress(Request $request, string $address): JsonResponse
    {
        try {
            // Validation du paramètre
            if (empty(trim($address))) {
                return response()->json([
                    'success' => false,
                    'message' => 'L\'adresse ne peut pas être vide',
                    'error' => 'Paramètre invalide'
                ], 400);
            }

            $cabinets = Cabinet::select([
                'id',
                'owner_id',
                'name',
                'description',
                'image',
                'detail_images',
                'address',
                'city',
                'postal_code',
                'email',
                'opening_time',
                'closing_time',
                'working_days',
                'latitude',
                'longitude',
                'is_active',
                'created_at',
                'updated_at'
            ])->where('address', 'like', '%' . $address . '%')->get();

            if ($cabinets->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun cabinet trouvé avec cette adresse',
                    'data' => [],
                    'count' => 0
                ], 404);
            }

            // Traiter les images détaillées
            $cabinets = $cabinets->map(function ($cabinet) {
                // S'assurer que detail_images est un tableau
                if (is_string($cabinet->detail_images)) {
                    $cabinet->detail_images = json_decode($cabinet->detail_images, true) ?? [];
                } else if (is_null($cabinet->detail_images)) {
                    $cabinet->detail_images = [];
                }

                return $cabinet;
            });

            // Pour une collection, on prend le premier élément pour les coordonnées
            $firstCabinet = $cabinets->first();

            return response()->json([
                'success' => true,
                'data' => $cabinets,
                'latitude' => $firstCabinet->latitude ?? null,
                'longitude' => $firstCabinet->longitude ?? null,
                'count' => $cabinets->count(),
                'message' => 'Cabinets trouvés avec succès'
            ], 200);

        } catch (QueryException $e) {
            Log::error('Erreur base de données lors de la recherche par adresse: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche du cabinet',
                'error' => 'Erreur de base de données'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Erreur inattendue dans getCabinetByAddress: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Une erreur inattendue s\'est produite',
                'error' => 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * Récupérer un cabinet par ID
     *
     * @param int $id
     * @return JsonResponse
     */
    public function getCabinetById(int $id): JsonResponse
    {
        try {
            if ($id <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID invalide',
                    'error' => 'Paramètre invalide'
                ], 400);
            }

            $cabinet = Cabinet::select([
                'id',
                'owner_id',
                'name',
                'description',
                'image',
                'detail_images',
                'address',
                'city',
                'postal_code',
                'email',
                'opening_time',
                'closing_time',
                'working_days',
                'latitude',
                'longitude',
                'is_active',
                'created_at',
                'updated_at'
            ])->find($id);

            if (!$cabinet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cabinet non trouvé',
                    'error' => 'Ressource non trouvée'
                ], 404);
            }

            // Traiter les images détaillées
            if (is_string($cabinet->detail_images)) {
                $cabinet->detail_images = json_decode($cabinet->detail_images, true) ?? [];
            } else if (is_null($cabinet->detail_images)) {
                $cabinet->detail_images = [];
            }

            return response()->json([
                'success' => true,
                'data' => $cabinet,
                'message' => 'Cabinet récupéré avec succès'
            ], 200);

        } catch (QueryException $e) {
            Log::error('Erreur base de données lors de la récupération du cabinet par ID: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du cabinet',
                'error' => 'Erreur de base de données'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Erreur inattendue dans getCabinetById: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Une erreur inattendue s\'est produite',
                'error' => 'Erreur serveur'
            ], 500);
        }
    }
}
