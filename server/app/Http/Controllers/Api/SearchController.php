<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\Cabinet;
use App\Models\Schedule;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;

class SearchController extends Controller
{
    /**
     * Search for cabinets by name, city, date, or specialty, including associated doctors.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        // Validate input parameters
        $validator = Validator::make($request->all(), [
            'search_term' => 'nullable|string|min:2|max:255',
            'date' => 'nullable|date_format:Y-m-d',
            'specialty_id' => 'nullable|integer|exists:specialities,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $searchTerm = $request->input('search_term');
        $date = $request->input('date');
        $specialtyId = $request->input('specialty_id');

        // Build the query
        $query = Cabinet::query()
            ->select('cabinets.id', 'cabinets.name', 'cabinets.address', 'cabinets.city', 'cabinets.postal_code',
                    'cabinets.email', 'cabinets.latitude', 'cabinets.longitude', 'cabinets.image')
            ->where('cabinets.is_active', true)
            ->with([
                'specialities' => function ($query) {
                    $query->select('specialities.id', 'specialities.name', 'specialities.icon')
                          ->where('specialities.is_active', true);
                },
                'doctors' => function ($query) use ($date, $specialtyId) {
                    $query->select('doctors.id', 'doctors.user_id', 'doctors.cabinet_id', 'doctors.name',
                                  'doctors.license_number', 'doctors.bio', 'doctors.consultation_fees',
                                  'doctors.start_time', 'doctors.end_time', 'doctors.available_days',
                                  'doctors.is_active', 'doctors.speciality_id')
                          ->where('doctors.is_active', true)
                          ->with(['speciality' => function ($q) {
                              $q->select('specialities.id', 'specialities.name', 'specialities.icon')
                                ->where('specialities.is_active', true);
                          }]);

                    // Apply specialty filter to doctors
                    if ($specialtyId) {
                        $query->where('speciality_id', $specialtyId);
                    }

                    // Apply date filter to doctors' schedules
                    if ($date) {
                        $dayOfWeek = strtolower(date('l', strtotime($date)));
                        $query->whereHas('schedules', function ($q) use ($dayOfWeek, $date) {
                            $q->where('day_of_week', $dayOfWeek)
                              ->where('is_active', true)
                              ->where('effective_from', '<=', $date)
                              ->where(function ($q) use ($date) {
                                  $q->whereNull('effective_until')
                                    ->orWhere('effective_until', '>=', $date);
                              })
                              ->where('allow_online_booking', true)
                              ->where('max_patients_per_slot', '>', 0)
                              ->whereExists(function ($subQuery) use ($date, $dayOfWeek) {
                                  $subQuery->select(DB::raw(1))
                                           ->from('schedules as s2')
                                           ->leftJoin('reservations as r', function ($join) use ($date) {
                                               $join->on('s2.id', '=', 'r.schedule_id')
                                                    ->where('r.reservation_date', $date)
                                                    ->whereIn('r.status', ['pending', 'confirmed']);
                                           })
                                           ->whereColumn('s2.id', 'schedules.id')
                                           ->groupBy('s2.id', 's2.start_time', 's2.slot_duration', 's2.max_patients_per_slot')
                                           ->havingRaw('COUNT(r.id) < s2.max_patients_per_slot');
                              });
                        });
                    }
                }
            ]);

        // Apply search term filter (name or city)
        if ($searchTerm) {
            $query->where(function ($q) use ($searchTerm) {
                $q->where('cabinets.name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('cabinets.city', 'like', '%' . $searchTerm . '%');
            });
        }

        // Apply specialty filter to cabinets
        if ($specialtyId) {
            $query->whereHas('specialities', function ($q) use ($specialtyId) {
                $q->where('specialities.id', $specialtyId)
                  ->where('specialities.is_active', true);
            });
        }

        // Apply date filter to cabinets (ensure at least one doctor is available)
        if ($date) {
            $dayOfWeek = strtolower(date('l', strtotime($date)));
            $query->whereHas('doctors.schedules', function ($q) use ($dayOfWeek, $date) {
                $q->where('day_of_week', $dayOfWeek)
                  ->where('is_active', true)
                  ->where('effective_from', '<=', $date)
                  ->where(function ($q) use ($date) {
                      $q->whereNull('effective_until')
                        ->orWhere('effective_until', '>=', $date);
                  })
                  ->where('allow_online_booking', true)
                  ->where('max_patients_per_slot', '>', 0)
                  ->whereExists(function ($subQuery) use ($date, $dayOfWeek) {
                      $subQuery->select(DB::raw(1))
                               ->from('schedules as s2')
                               ->leftJoin('reservations as r', function ($join) use ($date) {
                                   $join->on('s2.id', '=', 'r.schedule_id')
                                        ->where('r.reservation_date', $date)
                                        ->whereIn('r.status', ['pending', 'confirmed']);
                               })
                               ->whereColumn('s2.id', 'schedules.id')
                               ->groupBy('s2.id', 's2.start_time', 's2.slot_duration', 's2.max_patients_per_slot')
                               ->havingRaw('COUNT(r.id) < s2.max_patients_per_slot');
                  });
            })->whereHas('doctors', function ($q) {
                $q->where('is_active', true);
            });
        }

        // Execute the query
        $cabinets = $query->get();

        // Format the response to match frontend expectations
        $formattedCabinets = $cabinets->map(function ($cabinet) {
            return [
                'id' => $cabinet->id,
                'name' => $cabinet->name,
                'address' => $cabinet->address,
                'city' => $cabinet->city,
                'postal_code' => $cabinet->postal_code,
                'email' => $cabinet->email,
                'latitude' => (string) $cabinet->latitude, // Convert to string for frontend
                'longitude' => (string) $cabinet->longitude, // Convert to string for frontend
                'image' => $cabinet->image,
                'details_image'=>$cabinet->detail_images,
                'specialities' => $cabinet->specialities->map(function ($specialty) {
                    return [
                        'id' => $specialty->id,
                        'name' => $specialty->name,
                        'icon' => $specialty->icon,
                    ];
                })->toArray(),
                'doctors' => $cabinet->doctors->map(function ($doctor) {
                    return [
                        'id' => $doctor->id,
                        'user_id' => $doctor->user_id,
                        'cabinet_id' => $doctor->cabinet_id,
                        'name' => $doctor->name,
                        'license_number' => $doctor->license_number,
                        'bio' => $doctor->bio,
                        'consultation_fees' => (string) $doctor->consultation_fees, // Convert to string
                        'start_time' => $doctor->start_time ? $doctor->start_time->format('H:i:s') : null,
                        'end_time' => $doctor->end_time ? $doctor->end_time->format('H:i:s') : null,
                        'available_days' => $doctor->available_days ? json_decode($doctor->available_days, true) : [],
                        'is_active' => $doctor->is_active,
                        'speciality' => $doctor->speciality ? [
                            'id' => $doctor->speciality->id,
                            'name' => $doctor->speciality->name,
                            'icon' => $doctor->speciality->icon,
                        ] : null,
                    ];
                })->toArray(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $formattedCabinets,
            'message' => $formattedCabinets->isEmpty() ? 'No cabinets found.' : 'Cabinets retrieved successfully.',
        ], 200);
    }
}
