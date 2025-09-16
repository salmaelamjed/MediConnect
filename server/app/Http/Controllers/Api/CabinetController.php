<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cabinet;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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
            $cabinets = Cabinet::where('is_active', true)->get();

            return response()->json([
                'success' => true,
                'data' => $cabinets,
                'message' => 'Cabinets actifs récupérés avec succès',
                'count' => $cabinets->count()
            ], 200);

        } catch (QueryException $e) {
            Log::error('Erreur base de données lors de la récupération des cabinets actifs: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des cabinets actifs',
                'error' => 'Erreur de base de données'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Erreur inattendue dans allCabinetsActive: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Une erreur inattendue s\'est produite',
                'error' => 'Erreur serveur'
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
            $cabinets = Cabinet::all();

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
            $cabinets = Cabinet::where('name', 'like', '%' . $name . '%')->get();

            if ($cabinets->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun cabinet trouvé avec ce nom',
                    'data' => [],
                    'count' => 0
                ], 404);
            }

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

            $cabinets = Cabinet::where('address', 'like', '%' . $address . '%')->get();

            if ($cabinets->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun cabinet trouvé avec cette adresse',
                    'data' => [],
                    'count' => 0
                ], 404);
            }

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

            $cabinet = Cabinet::find($id);

            if (!$cabinet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cabinet non trouvé',
                    'error' => 'Ressource non trouvée'
                ], 404);
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
