<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cabinet;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class CabinetController extends Controller
{
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
            'users.email as owner_email'
        )
        ->where('cabinets.id', $id)
        ->leftJoin('users', 'cabinets.owner_id', '=', 'users.id')
        ->leftJoin('doctors', 'users.id', '=', 'doctors.user_id')
        ->with([
            'specialities' => function ($query) {
                $query->select('specialities.id', 'specialities.name', 'specialities.description', 'specialities.icon', 'specialities.is_active');
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
                    'doctors.speciality_id' // Include speciality_id for debugging
                )
                ->whereNotNull('doctors.speciality_id') // Exclude doctors with null speciality_id
                ->with([
                    'speciality' => function ($query) {
                        $query->select('specialities.id', 'specialities.name', 'specialities.description', 'specialities.icon', 'specialities.is_active');
                    }
                ]);
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

        // Traiter les images détaillées
        if (is_string($cabinet->detail_images)) {
            $cabinet->detail_images = json_decode($cabinet->detail_images, true) ?? [];
        } else if (is_null($cabinet->detail_images)) {
            $cabinet->detail_images = [];
        }

        // Transformer les specialities
        $cabinet->specialities = $cabinet->specialities->map(function ($speciality) {
            return [
                'id' => $speciality->id,
                'name' => $speciality->name,
                'description' => $speciality->description,
                'icon' => $speciality->icon,
                'is_active' => $speciality->is_active,
                'pivot' => $speciality->pivot // Include pivot data if needed
            ];
        })->toArray();

        // Transformer les doctors pour inclure la spécialité
        $cabinet->doctors = $cabinet->doctors->map(function ($doctor) {
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
                'speciality' => $doctor->speciality ? [
                    'id' => $doctor->speciality->id,
                    'name' => $doctor->speciality->name,
                    'description' => $doctor->speciality->description,
                    'icon' => $doctor->speciality->icon,
                    'is_active' => $doctor->speciality->is_active
                ] : null
            ];
        })->toArray();

        // Log pour débogage
        Log::info('Cabinet details retrieved', ['cabinet_id' => $id, 'doctors' => $cabinet->doctors]);

        return response()->json([
            'success' => true,
            'data' => $cabinet,
            'message' => 'Détails du cabinet récupérés avec succès'
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
