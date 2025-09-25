<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AppointmentCancelled;
use App\Mail\AppointmentReminder;
use App\Mail\AppointmentRescheduled;
use App\Models\Reservation;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use App\Models\Notification;
use App\Models\Schedule;
use App\Mail\AppointmentConfirmed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class ReservationController extends Controller
{
    /**
     * Display all reservations based on user role.
     */
    public function index()
    {
        $user = Auth::user();

        $query = Reservation::with(['patient.user', 'doctor.user', 'cabinet'])
            ->orderBy('reservation_date', 'desc')
            ->orderBy('reservation_time', 'desc');

        if ($user->role === 'doctor') {
            $doctor = Doctor::where('user_id', $user->id)->firstOrFail();
            $query->where('doctor_id', $doctor->id);
        } elseif ($user->role === 'patient') {
            $patient = Patient::where('user_id', $user->id)->firstOrFail();
            $query->where('patient_id', $patient->id);
        } elseif ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $reservations = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $reservations
        ], 200);
    }

    /**
     * Create a new reservation (Patient only).
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'patient') {
            return response()->json(['message' => 'Only patients can make reservations.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'doctor_id' => 'required|exists:doctors,id',
            'cabinet_id' => 'required|exists:cabinets,id',
            'reservation_date' => 'required|date|after:today',
            'reservation_time' => 'required|date_format:H:i',
            'reason' => 'nullable|string|max:1000',
            'patient_email' => 'nullable|email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $patient = Patient::where('user_id', $user->id)->firstOrFail();
            $schedule = $this->validateSchedule(
                $request->doctor_id,
                $request->cabinet_id,
                $request->reservation_date,
                $request->reservation_time
            );

            if (!$schedule) {
                return response()->json([
                    'success' => false,
                    'message' => 'The requested slot is not available.'
                ], 409);
            }

            // Check existing reservations
            $existingReservations = Reservation::where('doctor_id', $request->doctor_id)
                ->where('reservation_date', $request->reservation_date)
                ->where('reservation_time', $request->reservation_time)
                ->whereIn('status', ['pending', 'confirmed'])
                ->count();

            if ($existingReservations >= $schedule->max_patients_per_slot) {
                return response()->json([
                    'success' => false,
                    'message' => 'This slot is fully booked.'
                ], 409);
            }

            $reservation = Reservation::create([
                'patient_id' => $patient->id,
                'doctor_id' => $request->doctor_id,
                'cabinet_id' => $request->cabinet_id,
                'reservation_date' => $request->reservation_date,
                'reservation_time' => $request->reservation_time,
                'reason' => $request->reason,
                'patient_email' => $request->patient_email ?? $user->email,
                'status' => 'pending'
            ]);

            $doctor = Doctor::with('user')->findOrFail($request->doctor_id);
            $notification = $this->createNotification(
                $doctor->user_id,
                'New Appointment Request',
                // French: "Le patient {$patient->name} souhaite prendre un rendez-vous le..."
                "Patient {$patient->name} has requested an appointment on " .
                Carbon::parse($request->reservation_date)->format('d/m/Y') .
                " at " . Carbon::parse($request->reservation_time)->format('H:i'),
                'appointment_confirmation',
                $reservation->id
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Your appointment request has been sent to the doctor.',
                'data' => $reservation->load(['doctor.user', 'cabinet', 'patient.user'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Error creating reservation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Confirm a reservation (Doctor only).
     */
    public function confirm($id)
    {
        $user = Auth::user();

        if ($user->role !== 'doctor') {
            return response()->json(['message' => 'Only doctors can confirm reservations.'], 403);
        }

        try {
            DB::beginTransaction();

            $doctor = Doctor::where('user_id', $user->id)->firstOrFail();
            $reservation = Reservation::with(['patient.user', 'doctor.user'])
                ->where('doctor_id', $doctor->id)
                ->where('id', $id)
                ->where('status', 'pending')
                ->firstOrFail();

            $reservation->update([
                'status' => 'confirmed',
                'confirmed_at' => now()
            ]);

            $notification = $this->createNotification(
                $reservation->patient->user_id,
                'Appointment Confirmed',
                // French: "Votre rendez-vous avec Dr. {$reservation->doctor->name} le..."
                "Your appointment with Dr. {$reservation->doctor->name} on " .
                Carbon::parse($reservation->reservation_date)->format('d/m/Y') .
                " at " . Carbon::parse($reservation->reservation_time)->format('H:i') .
                " has been confirmed.",
                'appointment_confirmation',
                $reservation->id
            );

            $this->sendConfirmationEmail($reservation, $notification);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Reservation successfully confirmed',
                'data' => $reservation
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Error confirming reservation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a reservation.
     */
    public function cancel(Request $request, $id)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'cancellation_reason' => 'required|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $reservation = Reservation::with(['patient.user', 'doctor.user'])->findOrFail($id);

            $canCancel = false;
            $cancelledBy = '';

            if ($user->role === 'patient') {
                $patient = Patient::where('user_id', $user->id)->firstOrFail();
                $canCancel = $reservation->patient_id === $patient->id;
                $cancelledBy = 'patient';
            } elseif ($user->role === 'doctor') {
                $doctor = Doctor::where('user_id', $user->id)->firstOrFail();
                $canCancel = $reservation->doctor_id === $doctor->id;
                $cancelledBy = 'doctor';
            } elseif ($user->role === 'admin') {
                $canCancel = true;
                $cancelledBy = 'admin';
            }

            if (!$canCancel) {
                return response()->json(['message' => 'Not authorized to cancel this reservation'], 403);
            }

            if (!in_array($reservation->status, ['pending', 'confirmed'])) {
                return response()->json(['message' => 'This reservation cannot be canceled'], 400);
            }

            $reservation->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancelled_by' => $cancelledBy,
                'cancellation_reason' => $request->cancellation_reason
            ]);

            if ($cancelledBy === 'patient') {
                $this->createNotification(
                    $reservation->doctor->user_id,
                    'Appointment Canceled',
                    // French: "Le patient {$reservation->patient->name} a annulé son rendez-vous..."
                    "Patient {$reservation->patient->name} canceled their appointment on " .
                    Carbon::parse($reservation->reservation_date)->format('d/m/Y') .
                    " at " . Carbon::parse($reservation->reservation_time)->format('H:i') .
                    ". Reason: {$request->cancellation_reason}",
                    'appointment_cancellation',
                    $reservation->id
                );
            } else {
                $notification = $this->createNotification(
                    $reservation->patient->user_id,
                    'Appointment Canceled',
                    // French: "Votre rendez-vous avec Dr. {$reservation->doctor->name} a été annulé..."
                    "Your appointment with Dr. {$reservation->doctor->name} on " .
                    Carbon::parse($reservation->reservation_date)->format('d/m/Y') .
                    " at " . Carbon::parse($reservation->reservation_time)->format('H:i') .
                    " has been canceled. Reason: {$request->cancellation_reason}",
                    'appointment_cancellation',
                    $reservation->id
                );

                $this->sendCancellationEmail($reservation, $notification);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Reservation canceled successfully',
                'data' => $reservation
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Error canceling reservation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark a reservation as completed (Doctor only).
     */
    public function complete(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'doctor') {
            return response()->json(['message' => 'Only doctors can mark reservations as completed'], 403);
        }

        $validator = Validator::make($request->all(), [
            'doctor_notes' => 'nullable|string|max:2000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $doctor = Doctor::where('user_id', $user->id)->firstOrFail();
            $reservation = Reservation::with(['patient.user'])
                ->where('doctor_id', $doctor->id)
                ->where('id', $id)
                ->where('status', 'confirmed')
                ->firstOrFail();

            $reservation->update([
                'status' => 'completed',
                'doctor_notes' => $request->doctor_notes
            ]);

            $this->createNotification(
                $reservation->patient->user_id,
                'Consultation Completed',
                // French: "Votre consultation avec Dr. {$reservation->doctor->name} s'est terminée..."
                "Your consultation with Dr. {$reservation->doctor->name} has been completed. Thank you for your visit.",
                'appointment_confirmation',
                $reservation->id
            );

            // Notify patient to leave a review
            $this->createNotification(
                $reservation->patient->user_id,
                'Leave a Review',
                // French: "Veuillez laisser un avis sur votre consultation..."
                "Please share your feedback about your consultation with Dr. {$reservation->doctor->name}.",
                'review_request',
                $reservation->id
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Reservation marked as completed',
                'data' => $reservation
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Error completing reservation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display details of a reservation.
     */
    public function show($id)
    {
        $user = Auth::user();

        try {
            $reservation = Reservation::with(['patient.user', 'doctor.user', 'cabinet'])->findOrFail($id);

            $canView = false;

            if ($user->role === 'patient') {
                $patient = Patient::where('user_id', $user->id)->firstOrFail();
                $canView = $reservation->patient_id === $patient->id;
            } elseif ($user->role === 'doctor') {
                $doctor = Doctor::where('user_id', $user->id)->firstOrFail();
                $canView = $reservation->doctor_id === $doctor->id;
            } elseif ($user->role === 'admin') {
                $canView = true;
            }

            if (!$canView) {
                return response()->json(['message' => 'Not authorized to view this reservation'], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $reservation
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving reservation details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available slots for a doctor on a specific date.
     */
public function getAvailableSlots(Request $request, $doctorId)
{
    $validator = Validator::make($request->all(), [
        'date' => 'required|date|after:today',
        'cabinet_id' => 'required|exists:cabinets,id'
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        $doctor = Doctor::findOrFail($doctorId);
        $date = Carbon::parse($request->date)->timezone('Africa/Casablanca');
        $dayOfWeek = strtolower($date->format('l'));

        // Get the doctor's schedule
        $schedule = Schedule::where('doctor_id', $doctorId)
            ->where('cabinet_id', $request->cabinet_id)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->where('effective_from', '<=', $date)
            ->where(function ($query) use ($date) {
                $query->whereNull('effective_until')
                      ->orWhere('effective_until', '>=', $date);
            })
            ->where('allow_online_booking', true)
            ->first();

        if (!$schedule) {
            return response()->json([
                'success' => false,
                'message' => 'No available schedule for the selected date and cabinet.'
            ], 404);
        }

        // Check advance booking constraints
        if ($date->diffInDays(Carbon::now()->timezone('Africa/Casablanca')) > $schedule->advance_booking_days) {
            return response()->json([
                'success' => false,
                'message' => "Bookings are only allowed up to {$schedule->advance_booking_days} days in advance."
            ], 400);
        }

        if ($date->isToday() && Carbon::now()->timezone('Africa/Casablanca')->diffInHours($date->setTimeFromTimeString('23:59')) < $schedule->min_booking_hours) {
            return response()->json([
                'success' => false,
                'message' => "Bookings must be made at least {$schedule->min_booking_hours} hours in advance."
            ], 400);
        }

        // Get existing reservations with time normalization
        $existingReservations = Reservation::where('doctor_id', $doctorId)
            ->where('cabinet_id', $request->cabinet_id)
            ->where('reservation_date', $date->toDateString())
            ->whereIn('status', ['pending', 'confirmed'])
            ->select(DB::raw('TIME_FORMAT(reservation_time, "%H:%i") as reservation_time'), DB::raw('count(*) as reservation_count'))
            ->groupBy('reservation_time')
            ->pluck('reservation_count', 'reservation_time')
            ->toArray();

        // Generate available slots
        $availableSlots = [];
        $startTime = Carbon::parse($schedule->start_time)->timezone('Africa/Casablanca');
        $endTime = Carbon::parse($schedule->end_time)->timezone('Africa/Casablanca');
        $breakStart = $schedule->break_start_time ? Carbon::parse($schedule->break_start_time)->timezone('Africa/Casablanca') : null;
        $breakEnd = $schedule->break_end_time ? Carbon::parse($schedule->break_end_time)->timezone('Africa/Casablanca') : null;
        $slotDuration = $schedule->slot_duration;
        $bufferTime = $schedule->buffer_time;
        $maxPatients = $schedule->max_patients_per_slot;

        $currentTime = $startTime->copy();
        while ($currentTime <= $endTime) {
            // Ensure the slot doesn't extend past endTime
            $slotEnd = $currentTime->copy()->addMinutes($slotDuration);
            if ($slotEnd > $endTime) {
                break;
            }

            $timeString = $currentTime->format('H:i');

            // Skip break times
            if ($breakStart && $breakEnd && $currentTime->between($breakStart, $breakEnd)) {
                $currentTime->addMinutes($slotDuration + $bufferTime);
                continue;
            }

            // Check if slot is available
            $reservationsAtTime = $existingReservations[$timeString] ?? 0;
            if ($reservationsAtTime < $maxPatients) {
                $availableSlots[] = $timeString;
            }

            $currentTime->addMinutes($slotDuration + $bufferTime);
        }

        return response()->json([
            'success' => true,
            'date' => $date->format('Y-m-d'),
            'available_slots' => $availableSlots
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error retrieving available slots',
            'error' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Reschedule a reservation (Patient, Doctor, or Admin).
     */
    public function reschedule(Request $request, $id)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'reservation_date' => 'required|date|after:today',
            'reservation_time' => 'required|date_format:H:i',
            'cabinet_id' => 'required|exists:cabinets,id',
            'reason' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $reservation = Reservation::with(['patient.user', 'doctor.user'])->findOrFail($id);

            $canReschedule = false;
            $rescheduledBy = '';

            if ($user->role === 'patient') {
                $patient = Patient::where('user_id', $user->id)->firstOrFail();
                $canReschedule = $reservation->patient_id === $patient->id;
                $rescheduledBy = 'patient';
            } elseif ($user->role === 'doctor') {
                $doctor = Doctor::where('user_id', $user->id)->firstOrFail();
                $canReschedule = $reservation->doctor_id === $doctor->id;
                $rescheduledBy = 'doctor';
            } elseif ($user->role === 'admin') {
                $canReschedule = true;
                $rescheduledBy = 'admin';
            }

            if (!$canReschedule) {
                return response()->json(['message' => 'Not authorized to reschedule this reservation'], 403);
            }

            if (!in_array($reservation->status, ['pending', 'confirmed'])) {
                return response()->json(['message' => 'This reservation cannot be rescheduled'], 400);
            }

            $schedule = $this->validateSchedule(
                $reservation->doctor_id,
                $request->cabinet_id,
                $request->reservation_date,
                $request->reservation_time
            );

            if (!$schedule) {
                return response()->json([
                    'success' => false,
                    'message' => 'The requested slot is not available.'
                ], 409);
            }

            $existingReservations = Reservation::where('doctor_id', $reservation->doctor_id)
                ->where('reservation_date', $request->reservation_date)
                ->where('reservation_time', $request->reservation_time)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where('id', '!=', $id)
                ->count();

            if ($existingReservations >= $schedule->max_patients_per_slot) {
                return response()->json([
                    'success' => false,
                    'message' => 'This slot is fully booked.'
                ], 409);
            }

            $oldDate = $reservation->reservation_date;
            $oldTime = $reservation->reservation_time;

            $reservation->update([
                'reservation_date' => $request->reservation_date,
                'reservation_time' => $request->reservation_time,
                'cabinet_id' => $request->cabinet_id,
                'status' => 'pending', // Reset to pending for doctor confirmation
                'confirmed_at' => null
            ]);

            $notificationMessage = $request->reason
                ? " Reason: {$request->reason}"
                : '';

            if ($rescheduledBy === 'patient') {
                $this->createNotification(
                    $reservation->doctor->user_id,
                    'Appointment Rescheduled',
                    // French: "Le patient {$reservation->patient->name} a reprogrammé son rendez-vous..."
                    "Patient {$reservation->patient->name} has rescheduled their appointment from " .
                    Carbon::parse($oldDate)->format('d/m/Y') . " at " . $oldTime .
                    " to " . Carbon::parse($request->reservation_date)->format('d/m/Y') .
                    " at " . Carbon::parse($request->reservation_time)->format('H:i') .
                    $notificationMessage,
                    'appointment_rescheduled',
                    $reservation->id
                );
            } else {
                $notification = $this->createNotification(
                    $reservation->patient->user_id,
                    'Appointment Rescheduled',
                    // French: "Votre rendez-vous avec Dr. {$reservation->doctor->name} a été reprogrammé..."
                    "Your appointment with Dr. {$reservation->doctor->name} has been rescheduled from " .
                    Carbon::parse($oldDate)->format('d/m/Y') . " at " . $oldTime .
                    " to " . Carbon::parse($request->reservation_date)->format('d/m/Y') .
                    " at " . Carbon::parse($request->reservation_time)->format('H:i') .
                    $notificationMessage,
                    'appointment_rescheduled',
                    $reservation->id
                );

                $this->sendRescheduleEmail($reservation, $notification);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Reservation rescheduled successfully',
                'data' => $reservation->load(['doctor.user', 'cabinet', 'patient.user'])
            ], 200);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Error rescheduling reservation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send a reminder for a confirmed reservation.
     */
    public function sendReminder($id)
    {
        $user = Auth::user();

        if ($user->role !== 'doctor' && $user->role !== 'admin') {
            return response()->json(['message' => 'Only doctors or admins can send reminders'], 403);
        }

        try {
            $reservation = Reservation::with(['patient.user', 'doctor.user'])
                ->where('id', $id)
                ->where('status', 'confirmed')
                ->where('email_reminder_sent', false)
                ->firstOrFail();

            if ($user->role === 'doctor') {
                $doctor = Doctor::where('user_id', $user->id)->firstOrFail();
                if ($reservation->doctor_id !== $doctor->id) {
                    return response()->json(['message' => 'Not authorized to send reminder for this reservation'], 403);
                }
            }

            $notification = $this->createNotification(
                $reservation->patient->user_id,
                'Appointment Reminder',
                // French: "Rappel : Votre rendez-vous avec Dr. {$reservation->doctor->name} est prévu..."
                "Reminder: Your appointment with Dr. {$reservation->doctor->name} is scheduled for " .
                Carbon::parse($reservation->reservation_date)->format('d/m/Y') .
                " at " . Carbon::parse($reservation->reservation_time)->format('H:i'),
                'appointment_reminder',
                $reservation->id
            );

            $reservation->update([
                'email_reminder_sent' => true,
                'reminder_sent_at' => now()
            ]);

            $this->sendReminderEmail($reservation, $notification);

            return response()->json([
                'success' => true,
                'message' => 'Reminder sent successfully',
                'data' => $reservation
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error sending reminder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get reservation statistics (Admin or Doctor).
     */
    public function getStats()
    {
        $user = Auth::user();

        try {
            $query = Reservation::query();

            if ($user->role === 'doctor') {
                $doctor = Doctor::where('user_id', $user->id)->firstOrFail();
                $query->where('doctor_id', $doctor->id);
            } elseif ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $stats = $query->selectRaw(
                'COUNT(*) as total, ' .
                'SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending, ' .
                'SUM(CASE WHEN status = "confirmed" THEN 1 ELSE 0 END) as confirmed, ' .
                'SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed, ' .
                'SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled, ' .
                'SUM(CASE WHEN reservation_date = ? THEN 1 ELSE 0 END) as today, ' .
                'SUM(CASE WHEN reservation_date BETWEEN ? AND ? THEN 1 ELSE 0 END) as this_week, ' .
                'SUM(CASE WHEN MONTH(reservation_date) = ? AND YEAR(reservation_date) = ? THEN 1 ELSE 0 END) as this_month',
                [
                    Carbon::today()->toDateString(),
                    Carbon::now()->startOfWeek()->toDateString(),
                    Carbon::now()->endOfWeek()->toDateString(),
                    Carbon::now()->month,
                    Carbon::now()->year
                ]
            )->first();

            return response()->json([
                'success' => true,
                'stats' => $stats
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate schedule for a reservation slot.
     */
    private function validateSchedule($doctorId, $cabinetId, $date, $time)
    {
        $date = Carbon::parse($date);
        $dayOfWeek = strtolower($date->format('l'));

        $schedule = Schedule::where('doctor_id', $doctorId)
            ->where('cabinet_id', $cabinetId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->where('effective_from', '<=', $date)
            ->where(function ($query) use ($date) {
                $query->whereNull('effective_until')
                      ->orWhere('effective_until', '>=', $date);
            })
            ->where('allow_online_booking', true)
            ->first();

        if (!$schedule) {
            return null;
        }

        $time = Carbon::parse($time);
        $startTime = Carbon::parse($schedule->start_time);
        $endTime = Carbon::parse($schedule->end_time);
        $breakStart = $schedule->break_start_time ? Carbon::parse($schedule->break_start_time) : null;
        $breakEnd = $schedule->break_end_time ? Carbon::parse($schedule->break_end_time) : null;

        // Check if time is within schedule
        if (!$time->between($startTime, $endTime)) {
            return null;
        }

        // Check if time is during break
        if ($breakStart && $breakEnd && $time->between($breakStart, $breakEnd)) {
            return null;
        }

        // Check if time aligns with slot duration
        $minutesSinceStart = $startTime->diffInMinutes($time);
        if ($minutesSinceStart % ($schedule->slot_duration + $schedule->buffer_time) !== 0) {
            return null;
        }

        // Check advance booking constraints
        if ($date->diffInDays(Carbon::now()) > $schedule->advance_booking_days) {
            return null;
        }

        if ($date->isToday() && Carbon::now()->diffInHours($date->setTimeFromTimeString($time->format('H:i'))) < $schedule->min_booking_hours) {
            return null;
        }

        return $schedule;
    }

    /**
     * Create a notification and return the instance.
     */
    private function createNotification($userId, $title, $message, $type, $reservationId = null)
    {
        return Notification::create([
            'user_id' => $userId,
            'reservation_id' => $reservationId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'send_email' => true,
            'send_push' => true,
            'sent_at' => now(),
            'delivery_status' => ['email' => 'pending', 'push' => 'pending']
        ]);
    }

    /**
     * Send a confirmation email and update notification status.
     */
    private function sendConfirmationEmail($reservation, $notification)
    {
        try {
            Mail::to($reservation->patient_email)->queue(new AppointmentConfirmed($reservation));

            // Update notification delivery status
            $deliveryStatus = $notification->delivery_status ?? [];
            $deliveryStatus['email'] = 'sent';
            $notification->update([
                'delivery_status' => $deliveryStatus,
                'sent_at' => now()
            ]);
        } catch (\Exception $e) {
            // Log the error for debugging

            // Update notification delivery status to failed
            $deliveryStatus = $notification->delivery_status ?? [];
            $deliveryStatus['email'] = 'failed';
            $notification->update([
                'delivery_status' => $deliveryStatus
            ]);
        }
    }

    /**
     * Send a cancellation email and update notification status.
     */
    private function sendCancellationEmail($reservation, $notification)
    {
        try {
            Mail::to($reservation->patient_email)->queue(new AppointmentCancelled($reservation));

            // Update notification delivery status
            $deliveryStatus = $notification->delivery_status ?? [];
            $deliveryStatus['email'] = 'sent';
            $notification->update([
                'delivery_status' => $deliveryStatus,
                'sent_at' => now()
            ]);
        } catch (\Exception $e) {
            // Log the error for debugging

            // Update notification delivery status to failed
            $deliveryStatus = $notification->delivery_status ?? [];
            $deliveryStatus['email'] = 'failed';
            $notification->update([
                'delivery_status' => $deliveryStatus
            ]);
        }
    }

    /**
     * Send a reschedule email and update notification status.
     */
    private function sendRescheduleEmail($reservation, $notification)
    {
        try {
            Mail::to($reservation->patient_email)->queue(new AppointmentRescheduled($reservation));

            // Update notification delivery status
            $deliveryStatus = $notification->delivery_status ?? [];
            $deliveryStatus['email'] = 'sent';
            $notification->update([
                'delivery_status' => $deliveryStatus,
                'sent_at' => now()
            ]);
        } catch (\Exception $e) {
            // Log the error for debugging

            // Update notification delivery status to failed
            $deliveryStatus = $notification->delivery_status ?? [];
            $deliveryStatus['email'] = 'failed';
            $notification->update([
                'delivery_status' => $deliveryStatus
            ]);
        }
    }

    /**
     * Send a reminder email and update notification status.
     */
    private function sendReminderEmail($reservation, $notification)
    {
        try {
            Mail::to($reservation->patient_email)->queue(new AppointmentReminder($reservation));

            // Update notification delivery status
            $deliveryStatus = $notification->delivery_status ?? [];
            $deliveryStatus['email'] = 'sent';
            $notification->update([
                'delivery_status' => $deliveryStatus,
                'sent_at' => now()
            ]);
        } catch (\Exception $e) {
            // Log the error for debugging

            // Update notification delivery status to failed
            $deliveryStatus = $notification->delivery_status ?? [];
            $deliveryStatus['email'] = 'failed';
            $notification->update([
                'delivery_status' => $deliveryStatus
            ]);
        }
    }
}
