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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('reservation_id')->nullable()->constrained('reservations')->onDelete('cascade');

            // Notification content
            $table->string('title');
            $table->text('message');
            $table->enum('type', [
                'appointment_confirmation',
                'appointment_reminder',
                'appointment_cancellation',
                'appointment_rescheduled',
                'doctor_message',
                'system_update',
                'payment_reminder',
                'review_request'
            ]);

            // Delivery channels
            $table->boolean('send_email')->default(true);
            $table->boolean('send_push')->default(true);

            // Status tracking
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->json('delivery_status')->nullable(); // Track delivery across channels

            // Priority and scheduling
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->timestamp('scheduled_for')->nullable(); // For scheduled notifications

            // Additional data
            $table->json('data')->nullable(); // Extra notification data
            $table->string('action_url')->nullable(); // Deep link or action URL

            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'is_read']);
            $table->index(['type', 'scheduled_for']);
            $table->index(['priority', 'sent_at']);
            $table->index(['reservation_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
