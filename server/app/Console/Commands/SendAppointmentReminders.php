<?php

namespace App\Console\Commands;

use App\Models\Reservation;
use App\Models\Notification;
use App\Mail\AppointmentReminder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendAppointmentReminders extends Command
{
    protected $signature = 'reminders:send';
    protected $description = 'Send appointment reminders for upcoming confirmed reservations';

    public function handle()
    {
        $reservations = Reservation::with(['patient.user', 'doctor.user', 'cabinet'])
            ->where('status', 'confirmed')
            ->where('email_reminder_sent', false)
            ->where('reservation_date', '>=', Carbon::today())
            ->where('reservation_date', '<=', Carbon::tomorrow())
            ->get();

        if ($reservations->isEmpty()) {
            $this->info('No eligible reservations found for reminders.');
            return;
        }

        foreach ($reservations as $reservation) {
            try {
                $notification = Notification::create([
                    'user_id' => $reservation->patient->user_id,
                    'reservation_id' => $reservation->id,
                    'title' => 'Appointment Reminder',
                    'message' => "Reminder: Your appointment with Dr. {$reservation->doctor->name} is scheduled for " .
                        Carbon::parse($reservation->reservation_date)->format('d/m/Y') .
                        " at " . Carbon::parse($reservation->reservation_time)->format('H:i'),
                    'type' => 'appointment_reminder',
                    'send_email' => true,
                    'send_push' => true,
                    'sent_at' => now(),
                    'delivery_status' => ['email' => 'pending', 'push' => 'pending']
                ]);

                Mail::to($reservation->patient_email)->queue(new AppointmentReminder($reservation));

                $reservation->update([
                    'email_reminder_sent' => true,
                    'reminder_sent_at' => now()
                ]);

                $deliveryStatus = $notification->delivery_status;
                $deliveryStatus['email'] = 'sent';
                $notification->update(['delivery_status' => $deliveryStatus]);

                $this->info("Reminder sent for reservation ID {$reservation->id}");
            } catch (\Exception $e) {
                Log::error("Failed to send reminder for reservation ID {$reservation->id}: {$e->getMessage()}");
                $this->error("Failed to send reminder for reservation ID {$reservation->id}");
            }
        }

        $this->info('Appointment reminders processed successfully.');
    }
}
