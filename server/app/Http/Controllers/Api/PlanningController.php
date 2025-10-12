<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Models\Doctor;
use App\Models\Schedule;
use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class PlanningController extends Controller
{
    /**
     * Get doctor planning with optional date range
     * Par défaut: planning de la semaine courante (lundi à dimanche)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getDoctorPlanning(Request $request): JsonResponse
    {
        try {
            // Authentification et vérification du rôle
            $user = Auth::user();
            if ($user->role !== 'doctor') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access. Doctor role required.'
                ], 403);
            }

            // Récupération du docteur
            $doctor = Doctor::where('user_id', $user->id)->first();
            if (!$doctor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Doctor profile not found.'
                ], 404);
            }

            // Validation des dates - Par défaut: semaine courante
            $validation = $this->validateDateRange($request);
            if (!$validation['success']) {
                return response()->json($validation, 400);
            }

            $startDate = $validation['start_date'];
            $endDate = $validation['end_date'];

            // Récupération des données
            $schedules = $this->getDoctorSchedules($doctor->id);
            $reservations = $this->getReservationsForDoctor($doctor->id, $startDate, $endDate);

            // Génération du planning
            $planning = $this->generatePlanning($schedules, $reservations, $startDate, $endDate);

            return response()->json([
                'success' => true,
                'data' => [
                    'doctor' => [
                        'id' => $doctor->id,
                        'name' => $doctor->name,
                        'speciality' => $doctor->speciality->name ?? 'N/A',
                        'license_number' => $doctor->license_number,
                    ],
                    'planning_period' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'week_number' => Carbon::parse($startDate)->weekOfYear,
                        'total_days' => Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1,
                    ],
                    'planning' => $planning,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate date range from request
     * Par défaut: retourne la semaine courante (lundi à dimanche)
     */
    private function validateDateRange(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'sometimes|date|date_format:Y-m-d',
            'end_date' => 'sometimes|date|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'message' => 'Invalid date parameters',
                'errors' => $validator->errors()
            ];
        }

        // Dates par défaut : semaine courante (lundi à dimanche)
        $startDate = $request->input('start_date', Carbon::now()->startOfWeek(Carbon::MONDAY)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->endOfWeek(Carbon::SUNDAY)->format('Y-m-d'));

        // Validation supplémentaire pour s'assurer que end_date >= start_date
        if (Carbon::parse($startDate)->gt(Carbon::parse($endDate))) {
            return [
                'success' => false,
                'message' => 'Start date cannot be after end date'
            ];
        }

        // Limiter la plage de dates à maximum 30 jours pour éviter les requêtes trop lourdes
        $daysDifference = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate));
        if ($daysDifference > 30) {
            return [
                'success' => false,
                'message' => 'Date range cannot exceed 30 days'
            ];
        }

        return [
            'success' => true,
            'start_date' => $startDate,
            'end_date' => $endDate
        ];
    }

    /**
     * Get active schedules for doctor
     */
    private function getDoctorSchedules(int $doctorId)
    {
        return Schedule::where('doctor_id', $doctorId)
            ->where('is_active', true)
            ->get();
    }

    /**
     * Get reservations for doctor within date range
     */
    private function getReservationsForDoctor(int $doctorId, string $startDate, string $endDate): array
    {
        $reservations = Reservation::where('doctor_id', $doctorId)
            ->whereBetween('reservation_date', [$startDate, $endDate])
            ->with([
                'patient' => function ($query) {
                    $query->select('id', 'user_id', 'name', 'date_of_birth', 'gender', 'address', 'city', 'code_postal');
                },
                'patient.user' => function ($query) {
                    $query->select('id', 'email');
                },
                'cabinet' => function ($query) {
                    $query->select('id', 'name', 'address', 'city');
                }
            ])
            ->get();

        // Indexer les réservations par date + heure normalisée
        $indexedReservations = [];
        foreach ($reservations as $reservation) {
            $date = Carbon::parse($reservation->reservation_date)->format('Y-m-d');
            $time = Carbon::parse($reservation->reservation_time)->format('H:i:s');
            $key = $date . ' ' . $time;
            $indexedReservations[$key] = $reservation;
        }

        return $indexedReservations;
    }

    /**
     * Generate planning data
     */
    private function generatePlanning($schedules, $reservations, string $startDate, string $endDate): array
    {
        $planning = [];
        $currentDate = Carbon::parse($startDate);
        $endDate = Carbon::parse($endDate);

        // Statistiques
        $totalSlots = 0;
        $availableSlots = 0;
        $reservedSlots = 0;

        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');
            $dayOfWeek = strtolower($currentDate->englishDayOfWeek);

            $daySlots = $this->generateDaySlots($schedules, $reservations, $currentDate, $dayOfWeek);

            // Calculer les statistiques pour ce jour
            $dayStats = $this->calculateDayStats($daySlots);
            $totalSlots += $dayStats['total'];
            $availableSlots += $dayStats['available'];
            $reservedSlots += $dayStats['reserved'];

            $planning[$dateStr] = [
                'date' => $dateStr,
                'day_name' => $currentDate->locale('fr')->dayName,
                'day_number' => $currentDate->day,
                'is_today' => $currentDate->isToday(),
                'is_weekend' => $currentDate->isWeekend(),
                'slots' => $daySlots,
                'stats' => $dayStats
            ];

            $currentDate->addDay();
        }

        // Ajouter les statistiques globales
        $planning['_stats'] = [
            'total_slots' => $totalSlots,
            'available_slots' => $availableSlots,
            'reserved_slots' => $reservedSlots,
            'occupancy_rate' => $totalSlots > 0 ? round(($reservedSlots / $totalSlots) * 100, 2) : 0,
        ];

        return $planning;
    }

    /**
     * Calculate statistics for a day's slots
     */
    private function calculateDayStats(array $slots): array
    {
        $total = count($slots);
        $available = 0;
        $reserved = 0;

        foreach ($slots as $slot) {
            if ($slot['status'] === 'available') {
                $available++;
            } else {
                $reserved++;
            }
        }

        return [
            'total' => $total,
            'available' => $available,
            'reserved' => $reserved,
            'occupancy_rate' => $total > 0 ? round(($reserved / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Generate time slots for a specific day
     */
    private function generateDaySlots($schedules, $reservations, Carbon $date, string $dayOfWeek): array
    {
        $slots = [];
        $schedule = $schedules->firstWhere('day_of_week', $dayOfWeek);

        if (!$schedule || !$this->isScheduleEffective($schedule, $date)) {
            return $slots;
        }

        $startTime = Carbon::parse($schedule->start_time);
        $endTime = Carbon::parse($schedule->end_time);
        $slotDuration = $schedule->slot_duration;
        $bufferTime = $schedule->buffer_time;
        $breakStart = $schedule->break_start_time ? Carbon::parse($schedule->break_start_time) : null;
        $breakEnd = $schedule->break_end_time ? Carbon::parse($schedule->break_end_time) : null;

        $currentTime = $startTime->copy();

        while ($currentTime < $endTime) {
            // Gestion de la pause
            if ($breakStart && $currentTime >= $breakStart && $currentTime < $breakEnd) {
                $currentTime = $breakEnd->copy();
                continue;
            }

            $slotEnd = $currentTime->copy()->addMinutes($slotDuration);

            // Vérifier si le slot chevauche la pause
            if ($breakStart && $slotEnd > $breakStart && $currentTime < $breakEnd) {
                $currentTime = $breakEnd->copy();
                continue;
            }

            if ($slotEnd > $endTime) {
                break;
            }

            $slot = $this->createTimeSlot($date, $currentTime, $reservations);
            $slots[] = $slot;

            $currentTime->addMinutes($slotDuration + $bufferTime);
        }

        return $slots;
    }

    /**
     * Check if schedule is effective for the given date
     */
    private function isScheduleEffective($schedule, Carbon $date): bool
    {
        $dateStr = $date->format('Y-m-d');
        return $schedule->effective_from <= $dateStr &&
               (!$schedule->effective_until || $schedule->effective_until >= $dateStr);
    }

    /**
     * Create a time slot with reservation details
     */
    private function createTimeSlot(Carbon $date, Carbon $time, $reservations): array
    {
        $dateStr = $date->format('Y-m-d');
        $timeStr = $time->format('H:i:s');
        $key = $dateStr . ' ' . $timeStr;

        $slot = [
            'time' => $timeStr,
            'time_display' => $time->format('H:i'),
            'status' => 'available',
            'reservation' => null,
            'patient' => null,
        ];

        // Vérifier si une réservation existe pour ce créneau
        if (isset($reservations[$key])) {
            $reservation = $reservations[$key];
            $slot = $this->addReservationDetails($slot, $reservation);
        }

        return $slot;
    }

    /**
     * Add reservation details to slot
     */
    private function addReservationDetails(array $slot, $reservation): array
    {
        $slot['status'] = $reservation->status;
        $slot['reservation'] = [
            'id' => $reservation->id,
            'status' => $reservation->status,
            'reason' => $reservation->reason,
            'doctor_notes' => $reservation->doctor_notes,
            'is_follow_up' => $reservation->is_follow_up,
            'cabinet' => $reservation->cabinet ? [
                'name' => $reservation->cabinet->name,
                'address' => $reservation->cabinet->address,
                'city' => $reservation->cabinet->city,
            ] : null,
        ];

        if ($reservation->patient) {
            $slot['patient'] = [
                'id' => $reservation->patient->id,
                'name' => $reservation->patient->name,
                'date_of_birth' => $reservation->patient->date_of_birth,
                'age' => Carbon::parse($reservation->patient->date_of_birth)->age,
                'gender' => $reservation->patient->gender,
                'address' => $reservation->patient->address,
                'city' => $reservation->patient->city,
                'postal_code' => $reservation->patient->code_postal,
                'contact' => [
                    'email' => $reservation->patient->user->email ?? null,
                ]
            ];
        }

        return $slot;
    }

    /**
     * Get current week planning (alias pour plus de clarté)
     */
    public function getCurrentWeekPlanning(Request $request): JsonResponse
    {
        return $this->getDoctorPlanning($request);
    }

    /**
     * Get cabinet planning for doctor owner
     */
    public function getCabinetPlanning(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            if ($user->role !== 'doctor') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access. Doctor role required.'
                ], 403);
            }

            $owner = Doctor::where('user_id', $user->id)->first();
            if (!$owner || !$owner->cabinet_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not associated with a cabinet'
                ], 404);
            }

            $validation = $this->validateDateRange($request);
            if (!$validation['success']) {
                return response()->json($validation, 400);
            }

            $startDate = $validation['start_date'];
            $endDate = $validation['end_date'];

            $cabinetPlanning = $this->generateCabinetPlanning($owner->cabinet_id, $startDate, $endDate);

            return response()->json([
                'success' => true,
                'data' => [
                    'cabinet_id' => $owner->cabinet_id,
                    'cabinet_name' => $owner->cabinet->name ?? 'N/A',
                    'planning_period' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'week_number' => Carbon::parse($startDate)->weekOfYear,
                    ],
                    'doctors_planning' => $cabinetPlanning,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate planning for all doctors in cabinet
     */
    private function generateCabinetPlanning(int $cabinetId, string $startDate, string $endDate): array
    {
        $doctors = Doctor::where('cabinet_id', $cabinetId)
            ->where('is_active', true)
            ->with(['speciality', 'cabinet'])
            ->get();

        $cabinetPlanning = [];

        foreach ($doctors as $doctor) {
            $schedules = $this->getDoctorSchedules($doctor->id);
            $reservations = $this->getReservationsForDoctor($doctor->id, $startDate, $endDate);

            $planning = $this->generatePlanning($schedules, $reservations, $startDate, $endDate);

            $cabinetPlanning[] = [
                'doctor_id' => $doctor->id,
                'doctor_name' => $doctor->name,
                'planning' => $planning,
            ];
        }

        return $cabinetPlanning;
    }
}
