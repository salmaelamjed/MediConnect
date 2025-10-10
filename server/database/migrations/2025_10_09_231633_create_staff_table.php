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
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Link to users table
            $table->foreignId('cabinet_id')->nullable()->constrained('cabinets')->onDelete('set null'); // Optional link to cabinet
            $table->string('name'); // Staff member's name
            $table->string('job_title'); // e.g., Nurse, Receptionist, Assistant
            $table->string('phone_number')->nullable(); // Contact info
            $table->text('bio')->nullable(); // Brief description or qualifications
            $table->json('working_days')->nullable(); // e.g., ["monday", "wednesday"]
            $table->time('start_time')->nullable(); // Daily work start time
            $table->time('end_time')->nullable(); // Daily work end time
            $table->boolean('is_active')->default(true); // Staff status
            $table->timestamps();

            // Indexes for performance
            $table->index('user_id');
            $table->index('cabinet_id');
            $table->index('job_title');
            $table->index('is_active');

            // Unique constraint to prevent duplicate user_id
            $table->unique('user_id', 'unique_staff_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};