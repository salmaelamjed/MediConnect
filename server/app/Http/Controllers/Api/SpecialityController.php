<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Speciality;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log ;


class SpecialityController extends Controller
{
    public function allSpecialities()
    {
        $specialities=Speciality::all();
        return response()->json($specialities);
    }

     public function allSpecialitiesActive()
    {
        try {
            $specialities = Speciality::where('is_active', true)->get();

            return response()->json([
                'success' => true,
                'data' => $specialities,
                'message' => 'active specialities retrieved successfully',
                'count' => $specialities->count()
            ], 200);

        } catch (QueryException $e) {
            Log::error('Erreur base de données lors de la récupération des cabinets actifs: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des specialities actifs',
                'error' => 'Erreur de base de données'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Erreur inattendue dans allSpecialitiesActive: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Une erreur inattendue s\'est produite',
                'error' => 'Erreur serveur'
            ], 500);
        }
    }
}
