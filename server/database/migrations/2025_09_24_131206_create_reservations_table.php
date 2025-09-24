<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('doctor_id')->constrained('doctors')->onDelete('cascade');
            $table->foreignId('cabinet_id')->constrained('cabinets')->onDelete('cascade');

            // Reservation information
            $table->date('reservation_date');
            $table->time('reservation_time');
            $table->enum('status', [
                'pending',      // Pending confirmation
                'confirmed',    // Confirmed
                'completed',    // Completed
                'cancelled',    // Cancelled
                'no_show'       // Patient absent
            ])->default('pending');

            // Additional information
            $table->text('reason')->nullable(); // Consultation reason
            $table->text('doctor_notes')->nullable(); // Doctor's notes

            // Notifications and reminders
            $table->boolean('email_reminder_sent')->default(false);
            $table->timestamp('reminder_sent_at')->nullable();

            // Contact information
            $table->string('patient_email')->nullable();

            // Appointment management
            $table->boolean('is_follow_up')->default(false); // Follow-up appointment

            // Tracking timestamps
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancelled_by')->nullable(); // 'patient', 'doctor', 'admin'
            $table->text('cancellation_reason')->nullable();

            $table->timestamps();

            // Indexes to improve performance
            $table->index(['doctor_id', 'reservation_date', 'reservation_time']);
            $table->index(['patient_id', 'reservation_date']);
            $table->index(['cabinet_id', 'reservation_date']);
            $table->index(['status']);
            $table->index(['reservation_date', 'reservation_time']);

            // Unique constraint to avoid double bookings
            $table->unique(['doctor_id', 'reservation_date', 'reservation_time'], 'unique_doctor_datetime');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
