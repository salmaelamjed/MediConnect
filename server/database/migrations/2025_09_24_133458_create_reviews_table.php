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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('doctor_id')->constrained('doctors')->onDelete('cascade');
            $table->foreignId('reservation_id')->constrained('reservations')->onDelete('cascade');
            $table->foreignId('cabinet_id')->constrained('cabinets')->onDelete('cascade');

            // Rating and review content
            $table->tinyInteger('overall_rating'); // 1-5 stars
            $table->tinyInteger('facility_rating')->nullable(); // Cabinet/facility rating

            // Review text
            $table->text('review_text')->nullable();

            // Recommendation
            $table->boolean('would_recommend')->default(true);

            // Review status and moderation
            $table->enum('status', ['pending', 'approved', 'rejected', 'hidden'])->default('pending');
            $table->text('moderation_notes')->nullable();
            $table->foreignId('moderated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('moderated_at')->nullable();

            // Response from doctor/cabinet
            $table->text('doctor_response')->nullable();
            $table->timestamp('doctor_responded_at')->nullable();

            // Verification
            $table->boolean('is_verified')->default(false); // Verified patient visit
            $table->boolean('is_anonymous')->default(false); // Anonymous review

            // Helpful votes
            $table->integer('helpful_votes')->default(0);
            $table->integer('total_votes')->default(0);

            $table->timestamps();

            // Indexes
            $table->index(['doctor_id', 'status', 'created_at']);
            $table->index(['cabinet_id', 'status']);
            $table->index(['overall_rating']);
            $table->index(['is_verified']);
            $table->unique(['patient_id', 'reservation_id']); // One review per reservation
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
