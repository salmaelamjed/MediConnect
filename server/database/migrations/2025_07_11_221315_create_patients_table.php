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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
          $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Define user_id and foreign key
           $table->string('name');
           $table->string('profile')->nullable();
            $table->date('date_of_birth');
            $table->enum('gender', ['Female ','Male ']);
            $table->string('address');
            $table->string(column: 'city');
            $table->string('code_postal');
            $table->text('medical_history');
            $table->text('allergies');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
