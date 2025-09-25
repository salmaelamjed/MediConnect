<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'cabinet_id',
        'reservation_date',
        'reservation_time',
        'status',
        'reason',
        'doctor_notes',
        'email_reminder_sent',
        'reminder_sent_at',
        'patient_email',
        'is_follow_up',
        'confirmed_at',
        'cancelled_at',
        'cancelled_by',
        'cancellation_reason',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'reservation_date' => 'date',
        'reservation_time' => 'datetime:H:i',
        'email_reminder_sent' => 'boolean',
        'reminder_sent_at' => 'datetime',
        'is_follow_up' => 'boolean',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'status' => 'string',
    ];

    /**
     * Get the patient that owns the reservation.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the doctor that owns the reservation.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * Get the cabinet that owns the reservation.
     */
    public function cabinet(): BelongsTo
    {
        return $this->belongsTo(Cabinet::class);
    }
}
