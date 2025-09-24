<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;

use App\Models\Cabinet;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CabinetSearchController extends Controller
{
  public function index(Request $request): JsonResponse
    {
        return $this->search($request);
    }

    /**
     * Search cabinets with multiple filters
     */
    public function search(Request $request): JsonResponse
    {
        try {
            // Input data validation
            $validator = validator($request->all(), [
                'q' => 'nullable|string|min:2|max:100',
                'city' => 'nullable|string|max:50',
                'speciality' => 'nullable|exists:specialities,id',
                'sort_by' => 'nullable|in:distance,rating,name,doctors_count',
                'sort_order' => 'nullable|in:asc,desc',
                'is_open_now' => 'nullable|boolean',
                'availability_date' => 'nullable|date',
                'availability_time' => 'nullable|date_format:H:i',
                'min_rating' => 'nullable|numeric|min:0|max:5',
                'max_price' => 'nullable|numeric|min:0',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'radius' => 'nullable|numeric|min:1|max:100',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:50'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid search data',
                    'errors' => $validator->errors()
                ], 422);
            }

            $searchTerm = $request->get('q');
            $city = $request->get('city');
            $specialityId = $request->get('speciality');
            $sortBy = $request->get('sort_by', 'name');
            $sortOrder = $request->get('sort_order', 'asc');
            $isOpenNow = $request->get('is_open_now');
            $availabilityDate = $request->get('availability_date');
            $availabilityTime = $request->get('availability_time');
            $minRating = $request->get('min_rating');
            $maxPrice = $request->get('max_price');
            $latitude = $request->get('latitude');
            $longitude = $request->get('longitude');
            $radius = $request->get('radius');
            $perPage = $request->get('per_page', 10);

            // Build search query
            $query = Cabinet::with([
                'specialities',
                'doctors' => function ($query) {
                    $query->where('is_active', true)
                          ->with('speciality');
                },
                'owner'
            ])
            ->where('is_active', true)
            ->withCount('doctors');

            // Search by term (name, address, city, speciality name)
            if ($searchTerm) {
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('address', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('city', 'LIKE', "%{$searchTerm}%")
                      ->orWhereHas('specialities', function ($q) use ($searchTerm) {
                          $q->where('name', 'LIKE', "%{$searchTerm}%");
                      });
                });
            }

            // Filter by city
            if ($city) {
                $query->where('city', 'LIKE', "%{$city}%");
            }

            // Filter by specialty
            if ($specialityId) {
                $query->whereHas('specialities', function ($q) use ($specialityId) {
                    $q->where('specialities.id', $specialityId);
                });
            }

            // Filter by minimum rating
            if ($minRating) {
                $query->having('reviews_avg_rating', '>=', $minRating);
            }

            // Filter by maximum price
            if ($maxPrice) {
                $query->whereHas('doctors', function ($q) use ($maxPrice) {
                    $q->where('consultation_fees', '<=', $maxPrice);
                });
            }

            // Filter by proximity (distance)
            if ($latitude && $longitude) {
                $query->select('*')
                    ->selectRaw(
                        '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance',
                        [$latitude, $longitude, $latitude]
                    );

                if ($radius) {
                    $query->having('distance', '<=', $radius);
                }
            }

            // Filter by open now status
            if ($isOpenNow) {
                $query->where(function ($q) {
                    $currentTime = now();
                    $currentDay = strtolower($currentTime->englishDayOfWeek);

                    $q->where(function ($q) use ($currentTime, $currentDay) {
                        $q->whereJsonContains('working_days', $currentDay)
                          ->whereTime('opening_time', '<=', $currentTime->format('H:i:s'))
                          ->whereTime('closing_time', '>=', $currentTime->format('H:i:s'));
                    })->orWhereNull('opening_time') // Cabinets without specific hours
                      ->orWhere('opening_time', '') // Cabinets with empty hours
                      ->orWhere('closing_time', '');
                });
            }

            // Filter by availability date/time
            if ($availabilityDate || $availabilityTime) {
                $query->whereHas('doctors', function ($q) use ($availabilityDate, $availabilityTime) {
                    if ($availabilityDate) {
                        $dayName = Carbon::parse($availabilityDate)->englishDayOfWeek;
                        $q->whereJsonContains('available_days', strtolower($dayName));
                    }

                    if ($availabilityTime) {
                        $q->whereTime('start_time', '<=', $availabilityTime)
                          ->whereTime('end_time', '>=', $availabilityTime);
                    }
                });
            }

            // Sorting
            switch ($sortBy) {
                case 'distance':
                    if ($latitude && $longitude) {
                        $query->orderBy('distance', $sortOrder);
                    }
                    break;
                case 'doctors_count':
                    $query->orderBy('doctors_count', $sortOrder);
                    break;
                case 'name':
                default:
                    $query->orderBy('name', $sortOrder);
                    break;
            }

            // Execute search with pagination
            $cabinets = $query->paginate($perPage);

            // Format data
            $formattedCabinets = $this->formatCabinetsData($cabinets->items(), $latitude, $longitude);

            // Format response
            $response = [
                'success' => true,
                'message' => $this->getResultMessage($cabinets->total(), $searchTerm, $city, $specialityId),
                'data' => [
                    'cabinets' => $formattedCabinets,
                    'pagination' => [
                        'current_page' => $cabinets->currentPage(),
                        'last_page' => $cabinets->lastPage(),
                        'per_page' => $cabinets->perPage(),
                        'total' => $cabinets->total(),
                        'from' => $cabinets->firstItem(),
                        'to' => $cabinets->lastItem(),
                    ],
                    'filters_applied' => $this->getAppliedFilters($request)
                ]
            ];

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Cabinet search error: ' . $e->getMessage(), [
                'request' => $request->all(),
                'ip' => $request->ip(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during the search',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get cabinets open now
     */
    public function getOpenNow(Request $request): JsonResponse
    {
        try {
            $validator = validator($request->all(), [
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'radius' => 'nullable|numeric|min:1|max:50',
                'city' => 'nullable|string|max:50'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid parameters',
                    'errors' => $validator->errors()
                ], 422);
            }

            $currentTime = now();
            $currentDay = strtolower($currentTime->englishDayOfWeek);
            $latitude = $request->get('latitude');
            $longitude = $request->get('longitude');
            $radius = $request->get('radius', 10);
            $city = $request->get('city');

            $query = Cabinet::with(['specialities', 'doctors'])
                ->where('is_active', true)
                ->where(function ($q) use ($currentTime, $currentDay) {
                    $q->where(function ($q) use ($currentTime, $currentDay) {
                        $q->whereJsonContains('working_days', $currentDay)
                          ->whereTime('opening_time', '<=', $currentTime->format('H:i:s'))
                          ->whereTime('closing_time', '>=', $currentTime->format('H:i:s'));
                    })->orWhereNull('opening_time')
                      ->orWhere('opening_time', '')
                      ->orWhere('closing_time', '');
                });

            // Filter by city
            if ($city) {
                $query->where('city', 'LIKE', "%{$city}%");
            }

            // Filter by proximity
            if ($latitude && $longitude) {
                $query->select('*')
                    ->selectRaw(
                        '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance',
                        [$latitude, $longitude, $latitude]
                    )
                    ->having('distance', '<=', $radius)
                    ->orderBy('distance');
            } else {
                $query->orderBy('name');
            }

            $cabinets = $query->paginate(10);
            $formattedCabinets = $this->formatCabinetsData($cabinets->items(), $latitude, $longitude);

            return response()->json([
                'success' => true,
                'message' => "{$cabinets->total()} cabinets open now" . ($city ? " in {$city}" : ""),
                'data' => [
                    'cabinets' => $formattedCabinets,
                    'current_time' => $currentTime->format('H:i'),
                    'current_day' => $currentDay,
                    'pagination' => $cabinets->toArray()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Open now search error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error searching open cabinets'
            ], 500);
        }
    }

    /**
     * Get cabinets with availability for specific date/time
     */
    public function getAvailable(Request $request): JsonResponse
    {
        try {
            $validator = validator($request->all(), [
                'date' => 'required|date|after_or_equal:today',
                'time' => 'required|date_format:H:i',
                'speciality' => 'nullable|exists:specialities,id',
                'city' => 'nullable|string|max:50'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid availability parameters',
                    'errors' => $validator->errors()
                ], 422);
            }

            $date = Carbon::parse($request->date);
            $time = $request->time;
            $dayName = strtolower($date->englishDayOfWeek);
            $specialityId = $request->get('speciality');
            $city = $request->get('city');

            $query = Cabinet::with(['specialities', 'doctors' => function ($q) use ($dayName, $time) {
                $q->where('is_active', true)
                  ->whereJsonContains('available_days', $dayName)
                  ->whereTime('start_time', '<=', $time)
                  ->whereTime('end_time', '>=', $time)
                  ->with('speciality');
            }])
            ->where('is_active', true)
            ->whereHas('doctors', function ($q) use ($dayName, $time) {
                $q->where('is_active', true)
                  ->whereJsonContains('available_days', $dayName)
                  ->whereTime('start_time', '<=', $time)
                  ->whereTime('end_time', '>=', $time);
            });

            // Filter by specialty
            if ($specialityId) {
                $query->whereHas('specialities', function ($q) use ($specialityId) {
                    $q->where('specialities.id', $specialityId);
                });
            }

            // Filter by city
            if ($city) {
                $query->where('city', 'LIKE', "%{$city}%");
            }

            $cabinets = $query->orderBy('name')->paginate(10);
            $formattedCabinets = $this->formatCabinetsData($cabinets->items());

            return response()->json([
                'success' => true,
                'message' => "{$cabinets->total()} cabinets available on {$date->format('M j, Y')} at {$time}",
                'data' => [
                    'cabinets' => $formattedCabinets,
                    'search_date' => $date->format('Y-m-d'),
                    'search_time' => $time,
                    'pagination' => $cabinets->toArray()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Availability search error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error searching available cabinets'
            ], 500);
        }
    }

    /**
     * Get nearest cabinets
     */
    public function getNearest(Request $request): JsonResponse
    {
        try {
            $validator = validator($request->all(), [
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'radius' => 'nullable|numeric|min:1|max:100',
                'limit' => 'nullable|integer|min:1|max:50',
                'is_open_now' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid location parameters',
                    'errors' => $validator->errors()
                ], 422);
            }

            $latitude = $request->latitude;
            $longitude = $request->longitude;
            $radius = $request->radius ?? 10;
            $limit = $request->limit ?? 20;
            $isOpenNow = $request->get('is_open_now', false);

            $query = Cabinet::select('*')
                ->selectRaw(
                    '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance',
                    [$latitude, $longitude, $latitude]
                )
                ->with(['specialities', 'doctors'])
                ->where('is_active', true)
                ->having('distance', '<=', $radius);

            // Filter by open now
            if ($isOpenNow) {
                $currentTime = now();
                $currentDay = strtolower($currentTime->englishDayOfWeek);

                $query->where(function ($q) use ($currentTime, $currentDay) {
                    $q->where(function ($q) use ($currentTime, $currentDay) {
                        $q->whereJsonContains('working_days', $currentDay)
                          ->whereTime('opening_time', '<=', $currentTime->format('H:i:s'))
                          ->whereTime('closing_time', '>=', $currentTime->format('H:i:s'));
                    })->orWhereNull('opening_time')
                      ->orWhere('opening_time', '')
                      ->orWhere('closing_time', '');
                });
            }

            $cabinets = $query->orderBy('distance')
                            ->limit($limit)
                            ->get();

            $formattedCabinets = $this->formatCabinetsData($cabinets->toArray(), $latitude, $longitude);

            return response()->json([
                'success' => true,
                'message' => "{$cabinets->count()} nearest cabinets within {$radius}km",
                'data' => [
                    'cabinets' => $formattedCabinets,
                    'search_location' => [
                        'latitude' => $latitude,
                        'longitude' => $longitude,
                        'radius_km' => $radius
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Nearest cabinets search error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error searching nearest cabinets'
            ], 500);
        }
    }

    /**
     * Format cabinet data with distance if available
     */
    private function formatCabinetsData(array $cabinets, ?float $latitude = null, ?float $longitude = null): array
    {
        return array_map(function ($cabinet) use ($latitude, $longitude) {
            $data = [
                'id' => $cabinet->id,
                'name' => $cabinet->name,
                'description' => $cabinet->description,
                'image' => $cabinet->image,
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
                'rating_avg' => round($cabinet->reviews_avg_rating, 1),
                'doctors_count' => $cabinet->doctors_count,
                'specialities' => $this->formatSpecialities($cabinet->specialities),
                'doctors' => $this->formatDoctors($cabinet->doctors),
                'owner' => $cabinet->owner ? [
                    'id' => $cabinet->owner->id,
                    'name' => $cabinet->owner->name,
                    'email' => $cabinet->owner->email
                ] : null,
                'is_open_now' => $this->isCabinetOpenNow($cabinet)
            ];

            // Add distance if calculated
            if (isset($cabinet->distance)) {
                $data['distance_km'] = round($cabinet->distance, 2);
            }

            return $data;
        }, $cabinets);
    }

    /**
     * Check if cabinet is open now
     */
    private function isCabinetOpenNow($cabinet): bool
    {
        if (empty($cabinet->opening_time) || empty($cabinet->closing_time)) {
            return true; // Consider open if no hours specified
        }

        $currentTime = now();
        $currentDay = strtolower($currentTime->englishDayOfWeek);

        return in_array($currentDay, $cabinet->working_days ?? []) &&
               $currentTime->between(
                   Carbon::parse($cabinet->opening_time),
                   Carbon::parse($cabinet->closing_time)
               );
    }

    /**
     * Get applied filters for response
     */
    private function getAppliedFilters(Request $request): array
    {
        $filters = [];
        $applied = $request->only([
            'q', 'city', 'speciality', 'sort_by', 'sort_order',
            'is_open_now', 'min_rating', 'max_price', 'latitude',
            'longitude', 'radius'
        ]);

        foreach ($applied as $key => $value) {
            if (!empty($value)) {
                $filters[$key] = $value;
            }
        }

        return $filters;
    }
    /**
     * Format cabinet specialties
     */
    private function formatSpecialities($specialities): array
    {
        return $specialities->map(function ($speciality) {
            return [
                'id' => $speciality->id,
                'name' => $speciality->name,
                'description' => $speciality->description,
                'icon' => $speciality->icon
            ];
        })->toArray();
    }

    /**
     * Format cabinet doctors
     */
    private function formatDoctors($doctors): array
    {
        return $doctors->map(function ($doctor) {
            return [
                'id' => $doctor->id,
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
                    'icon' => $doctor->speciality->icon
                ] : null
            ];
        })->toArray();
    }

    /**
     * Geolocation-based proximity search
     */
    public function searchByLocation(Request $request): JsonResponse
    {
        try {
            $validator = validator($request->all(), [
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'radius' => 'nullable|numeric|min:1|max:100',
                'speciality' => 'nullable|exists:specialities,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid geographic coordinates',
                    'errors' => $validator->errors()
                ], 422);
            }

            $latitude = $request->latitude;
            $longitude = $request->longitude;
            $radius = $request->radius ?? 10;

            // Haversine formula for distance calculation
            $cabinets = Cabinet::select('*')
                ->selectRaw(
                    '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance',
                    [$latitude, $longitude, $latitude]
                )
                ->with(['specialities', 'doctors'])
                ->where('is_active', true)
                ->having('distance', '<=', $radius)
                ->orderBy('distance')
                ->paginate(10);

            // Format data
            $formattedCabinets = $this->formatCabinetsData($cabinets->items());

            return response()->json([
                'success' => true,
                'message' => "{$cabinets->total()} cabinets found within {$radius}km radius",
                'data' => [
                    'cabinets' => $formattedCabinets,
                    'pagination' => [
                        'current_page' => $cabinets->currentPage(),
                        'last_page' => $cabinets->lastPage(),
                        'total' => $cabinets->total()
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Geolocation search error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error during geolocation search'
            ], 500);
        }
    }

    /**
     * Get available cities for autocomplete
     */
    public function getCities(Request $request): JsonResponse
    {
        try {
            $searchTerm = $request->get('q');

            $cities = Cabinet::where('is_active', true)
                ->when($searchTerm, function ($query) use ($searchTerm) {
                    return $query->where('city', 'LIKE', "{$searchTerm}%");
                })
                ->distinct()
                ->pluck('city')
                ->sort()
                ->values();

            return response()->json([
                'success' => true,
                'data' => $cities
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving cities'
            ], 500);
        }
    }

    /**
     * Advanced search with all criteria
     */
    public function advancedSearch(Request $request): JsonResponse
    {
        try {
            $validator = validator($request->all(), [
                'q' => 'nullable|string|min:2|max:100',
                'city' => 'nullable|string|max:50',
                'speciality' => 'nullable|exists:specialities,id',
                'min_rating' => 'nullable|numeric|min:0|max:5',
                'max_price' => 'nullable|numeric|min:0',
                'availability' => 'nullable|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid search criteria',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = Cabinet::with(['specialities', 'doctors'])
                ->where('is_active', true)
                ->withAvg('reviews', 'rating')
                ->withCount('doctors');

            // Search by term
            if ($request->has('q') && $request->q) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'LIKE', "%{$request->q}%")
                      ->orWhere('address', 'LIKE', "%{$request->q}%")
                      ->orWhere('city', 'LIKE', "%{$request->q}%");
                });
            }

            // Filter by city
            if ($request->has('city') && $request->city) {
                $query->where('city', 'LIKE', "%{$request->city}%");
            }

            // Filter by specialty
            if ($request->has('speciality') && $request->speciality) {
                $query->whereHas('specialities', function ($q) use ($request) {
                    $q->where('speciality_id', $request->speciality);
                });
            }

            // Filter by minimum rating
            if ($request->has('min_rating') && $request->min_rating) {
                $query->having('reviews_avg_rating', '>=', $request->min_rating);
            }

            // Filter by maximum price
            if ($request->has('max_price') && $request->max_price) {
                $query->whereHas('doctors', function ($q) use ($request) {
                    $q->where('consultation_fees', '<=', $request->max_price);
                });
            }

            $cabinets = $query->orderBy('name')->paginate(10);
            $formattedCabinets = $this->formatCabinetsData($cabinets->items());

            return response()->json([
                'success' => true,
                'message' => $this->getResultMessage($cabinets->total(), $request->q, $request->city),
                'data' => [
                    'cabinets' => $formattedCabinets,
                    'pagination' => $cabinets->toArray()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Advanced search error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error during advanced search'
            ], 500);
        }
    }

    /**
     * Generate appropriate result message
     */
   /**
 * Generate appropriate result message
 */
        private function getResultMessage(int $total, ?string $searchTerm, ?string $city, ?string $specialityId = null): string
        {
            $specialityName = $specialityId ? \App\Models\Speciality::find($specialityId)?->name : null;

            if ($total === 0) {
                $parts = [];
                if ($searchTerm) $parts[] = "for '{$searchTerm}'";
                if ($city) $parts[] = "in the city '{$city}'";
                if ($specialityName) $parts[] = "with specialty '{$specialityName}'";

                if (!empty($parts)) {
                    return "No cabinets found " . implode(' ', $parts);
                }
                return "No cabinets available";
            }

            $parts = [];
            if ($searchTerm) $parts[] = "for '{$searchTerm}'";
            if ($city) $parts[] = "in the city '{$city}'";
            if ($specialityName) $parts[] = "with specialty '{$specialityName}'";

            if (!empty($parts)) {
                return "{$total} cabinets found " . implode(' ', $parts);
            }

            return "{$total} cabinets available";
        }
}
