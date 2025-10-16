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
        Schema::table('cabinets', function (Blueprint $table) {
            $table->json('detail_images')->nullable()->after('image'); // Ajustez 'after' selon votre besoin
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cabinets', function (Blueprint $table) {
            $table->dropColumn('detail_images');
        });
    }
};
