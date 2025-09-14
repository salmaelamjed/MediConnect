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
            $table->string('name');
            $table->string( 'specialite');
            $table->string('license_number')->unique();
            $table->string( 'bio')->nullable();
            $table->string( 'cabinet_name');
            $table->string('cabinet_address');
            $table->string( 'cabinet_city');
            $table->string('cabinet_postal_code');
            $table->time('heure_ouverture')->nullable();
            $table->time('heure_fermeture')->nullable();
            $table->json('jours_travail')->nullable();// ["lundi", "mardi", ...]
            $table->text('consultation_fees');
            $table->decimal('latitude',10,7);
            $table->decimal( 'longitude',10,7);
            $table->timestamps();
            // Index pour les recherches géographiques
            $table->index(['latitude', 'longitude']);
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
