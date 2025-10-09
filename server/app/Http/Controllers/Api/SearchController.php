<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cabinet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SearchController extends Controller
{
    /**
     * Search cabinets with filters
     */
    public function search(Request $request): JsonResponse
    {
        $validator = $this->validateRequest($request);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        try {
            $cabinets = $this->buildSearchQuery($request)->get();

            return $this->successResponse(
                $this->formatCabinets($cabinets),
                $cabinets->isEmpty() ? 'No cabinets found.' : 'Search completed successfully.'
            );
        } catch (\Exception $e) {
            return $this->serverError($e);
        }
    }

    /**
     * Validate request parameters
     */
    private function validateRequest(Request $request): \Illuminate\Validation\Validator
    {
        return Validator::make($request->all(), [
            'search_term' => 'nullable|string|min:2|max:255',
            'date' => 'nullable|date_format:Y-m-d',
            'specialty_id' => 'nullable|integer|exists:specialities,id',
        ]);
    }

    /**
     * Build the search query with filters
     */
    private function buildSearchQuery(Request $request)
    {
        $query = Cabinet::active()->with($this->getRelationships());

        $this->applySearchTermFilter($query, $request->search_term);
        $this->applySpecialtyFilter($query, $request->specialty_id);
        $this->applyDateFilter($query, $request->date);

        return $query;
    }

    /**
     * Define eager loading relationships
     */
    private function getRelationships(): array
    {
        return [
            'specialities' => fn($q) => $q->active()->select(['specialities.id', 'specialities.name', 'specialities.icon']),
            'doctors' => fn($q) => $q->active()->select([
                'doctors.id', 'doctors.user_id', 'doctors.cabinet_id', 'doctors.name',
                'doctors.license_number', 'doctors.bio', 'doctors.consultation_fees',
                'doctors.start_time', 'doctors.end_time', 'doctors.available_days',
                'doctors.is_active', 'doctors.speciality_id'
            ])->with(['speciality' => fn($q) => $q->active()->select(['specialities.id', 'specialities.name', 'specialities.icon'])]),
        ];
    }

    /**
     * Apply search term filter
     */
    private function applySearchTermFilter($query, ?string $searchTerm): void
    {
        if (empty($searchTerm)) return;

        $query->where(function ($q) use ($searchTerm) {
            $q->where('name', 'like', "%{$searchTerm}%")
              ->orWhere('city', 'like', "%{$searchTerm}%");
        });
    }

    /**
     * Apply specialty filter
     */
    private function applySpecialtyFilter($query, ?int $specialtyId): void
    {
        if (empty($specialtyId)) return;

        $query->whereHas('specialities', fn($q) =>
            $q->where('specialities.id', $specialtyId)->active()
        );
    }

    /**
     * Apply date filter based on doctors' available_days
     */
    private function applyDateFilter($query, ?string $date): void
    {
        if (empty($date)) return;

        $dayOfWeek = strtolower(date('l', strtotime($date)));
        $frenchDays = [
            'monday' => 'lundi',
            'tuesday' => 'mardi',
            'wednesday' => 'mercredi',
            'thursday' => 'jeudi',
            'friday' => 'vendredi',
            'saturday' => 'samedi',
            'sunday' => 'dimanche'
        ];
        $frenchDay = $frenchDays[$dayOfWeek] ?? $dayOfWeek;

        $query->whereHas('doctors', fn($q) => $q
            ->where('is_active', true)
            ->whereJsonContains('available_days', $frenchDay)
        );
    }

    /**
     * Format cabinets for response
     */
    private function formatCabinets($cabinets): array
    {
        return $cabinets->map(fn($cabinet) => [
            'id' => $cabinet->id,
            'name' => $cabinet->name ?? 'Unnamed Clinic',
            'address' => $cabinet->address,
            'city' => $cabinet->city,
            'postal_code' => $cabinet->postal_code,
            'email' => $cabinet->email,
            'latitude' => $this->formatCoordinate($cabinet->latitude),
            'longitude' => $this->formatCoordinate($cabinet->longitude),
            'image' => $cabinet->image ?? '/placeholder.svg',
            'specialities' => $this->formatSpecialities($cabinet->specialities),
            'doctors' => $this->formatDoctors($cabinet->doctors),
        ])->toArray();
    }

    /**
     * Format coordinate values
     */
    private function formatCoordinate($value): ?string
    {
        return $value ? (string) $value : null;
    }

    /**
     * Format specialities data
     */
    private function formatSpecialities($specialities): array
    {
        return $specialities->map(fn($specialty) => [
            'id' => $specialty->id,
            'name' => $specialty->name,
            'icon' => $specialty->icon,
        ])->toArray();
    }

    /**
     * Format doctors data
     */
    private function formatDoctors($doctors): array
    {
        return $doctors->map(fn($doctor) => [
            'id' => $doctor->id,
            'user_id' => $doctor->user_id,
            'cabinet_id' => $doctor->cabinet_id,
            'name' => $doctor->name ?? 'Unknown Doctor',
            'license_number' => $doctor->license_number,
            'bio' => $doctor->bio,
            'consultation_fees' => $this->formatFees($doctor->consultation_fees),
            'start_time' => $this->formatTime($doctor->start_time),
            'end_time' => $this->formatTime($doctor->end_time),
            'available_days' => $this->formatAvailableDays($doctor->available_days),
            'is_active' => (bool) $doctor->is_active,
            'speciality' => $this->formatDoctorSpeciality($doctor->speciality),
        ])->toArray();
    }

    /**
     * Format consultation fees
     */
    private function formatFees($fees): string
    {
        return $fees ? (string) $fees : '0.00';
    }

    /**
     * Format time values
     */
    private function formatTime($time): ?string
    {
        return $time?->format('H:i:s');
    }

    /**
     * Format available days
     */
    private function formatAvailableDays($availableDays): array
    {
        if (empty($availableDays)) return [];

        return is_string($availableDays)
            ? json_decode($availableDays, true) ?? []
            : (array) $availableDays;
    }

    /**
     * Format doctor's speciality
     */
    private function formatDoctorSpeciality($speciality): ?array
    {
        if (!$speciality) return null;

        return [
            'id' => $speciality->id,
            'name' => $speciality->name,
            'icon' => $speciality->icon,
        ];
    }

    /**
     * Success response helper
     */
    private function successResponse(array $data, string $message): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $data,
            'message' => $message,
        ], 200);
    }

    /**
     * Validation error response helper
     */
    private function validationError($errors): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => 'Validation failed',
            'errors' => $errors,
        ], 422);
    }

    /**
     * Server error response helper
     */
    private function serverError(\Exception $e): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => 'An error occurred while processing your request',
            'error' => config('app.debug') ? $e->getMessage() : null,
        ], 500);
    }
}
