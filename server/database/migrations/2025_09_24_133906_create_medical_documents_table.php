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
        Schema::create('medical_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('doctor_id')->constrained('doctors')->onDelete('cascade');
            $table->foreignId('reservation_id')->nullable()->constrained('reservations')->onDelete('set null');

            // Document information
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', [
                'prescription',     // Ordonnance
                'medical_report',   // Rapport médical
                'lab_result',       // Résultat d'analyse
                'xray',            // Radiographie
                'scan',            // Scanner/IRM
                'referral',        // Lettre de recommandation
                'certificate',     // Certificat médical
                'other'            // Autre
            ]);

            // File information
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type'); // PDF, JPG, etc.
            $table->integer('file_size'); // in bytes
            $table->string('mime_type');

            // Security and access
            $table->boolean('is_sensitive')->default(true);
            $table->json('access_permissions')->nullable(); // Who can access
            $table->string('encryption_key')->nullable(); // For encrypted files

            // Document validity
            $table->date('issued_date');
            $table->date('expires_at')->nullable(); // For prescriptions, certificates
            $table->boolean('is_active')->default(true);

            // Sharing and download tracking
            $table->integer('download_count')->default(0);
            $table->timestamp('last_accessed_at')->nullable();
            $table->boolean('shared_with_patient')->default(true);

            // Tags for organization
            $table->json('tags')->nullable(); // Searchable tags

            $table->timestamps();

            // Indexes
            $table->index(['patient_id', 'type', 'created_at']);
            $table->index(['doctor_id', 'created_at']);
            $table->index(['type', 'issued_date']);
            $table->index(['expires_at']);
            $table->index(['is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_documents');
    }
};
