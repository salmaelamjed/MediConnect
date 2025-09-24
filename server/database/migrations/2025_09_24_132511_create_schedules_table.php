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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->onDelete('cascade');
            $table->foreignId('cabinet_id')->constrained('cabinets')->onDelete('cascade');

            // Schedule information
            $table->enum('day_of_week', [
                'monday', 'tuesday', 'wednesday', 'thursday',
                'friday', 'saturday', 'sunday'
            ]);
            $table->time('start_time');
            $table->time('end_time');

            // Break time (lunch break, etc.)
            $table->time('break_start_time')->nullable();
            $table->time('break_end_time')->nullable();

            // Appointment duration and settings
            $table->integer('slot_duration')->default(30); // Duration in minutes
            $table->integer('buffer_time')->default(0); // Buffer time between appointments
            $table->integer('max_patients_per_slot')->default(1); // Patients per time slot

            // Schedule validity
            $table->date('effective_from'); // Schedule valid from this date
            $table->date('effective_until')->nullable(); // Schedule valid until this date

            // Schedule type and status
            $table->enum('schedule_type', ['regular', 'temporary', 'exception'])->default('regular');
            $table->boolean('is_active')->default(true);

            // Additional settings
            $table->boolean('allow_online_booking')->default(true);
            $table->integer('advance_booking_days')->default(30); // How many days in advance booking is allowed
            $table->integer('min_booking_hours')->default(2); // Minimum hours before appointment

            // Notes and description
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes for performance
            $table->index(['doctor_id', 'day_of_week']);
            $table->index(['cabinet_id', 'day_of_week']);
            $table->index(['doctor_id', 'effective_from', 'effective_until']);
            $table->index(['is_active']);
            $table->index(['schedule_type']);
            $table->index(['day_of_week', 'start_time']);

            // Unique constraint to prevent overlapping schedules
            $table->unique([
                'doctor_id', 'cabinet_id', 'day_of_week',
                'start_time', 'effective_from'
            ], 'unique_doctor_schedule');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
