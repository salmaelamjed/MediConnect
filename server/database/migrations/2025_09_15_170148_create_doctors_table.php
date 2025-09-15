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
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('speciality_id')->constrained('specialities')->onDelete('restrict');
            $table->foreignId('cabinet_id')->nullable()->constrained('cabinets')->onDelete('set null');
            $table->string('name');
            $table->string('license_number')->unique();
            $table->text('bio')->nullable();
            $table->decimal('consultation_fees', 8, 2)->nullable(); // Prix de consultation
            $table->time('start_time')->nullable(); // Heure de début des consultations
            $table->time('end_time')->nullable(); // Heure de fin des consultations
            $table->json('available_days')->nullable(); // Jours disponibles pour ce médecin
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Index pour améliorer les performances
            $table->index('speciality_id');
            $table->index('cabinet_id');
            $table->index(['is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};
