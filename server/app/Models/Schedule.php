<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Schedule extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'doctor_id',
        'cabinet_id',
        'day_of_week',
        'start_time',
        'end_time',
        'break_start_time',
        'break_end_time',
        'slot_duration',
        'buffer_time',
        'max_patients_per_slot',
        'effective_from',
        'effective_until',
        'schedule_type',
        'is_active',
        'allow_online_booking',
        'advance_booking_days',
        'min_booking_hours',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'break_start_time' => 'datetime:H:i',
        'break_end_time' => 'datetime:H:i',
        'effective_from' => 'date',
        'effective_until' => 'date',
        'is_active' => 'boolean',
        'allow_online_booking' => 'boolean',
        'slot_duration' => 'integer',
        'buffer_time' => 'integer',
        'max_patients_per_slot' => 'integer',
        'advance_booking_days' => 'integer',
        'min_booking_hours' => 'integer',
        'day_of_week' => 'string',
        'schedule_type' => 'string',
    ];

    /**
     * Get the doctor that owns the schedule.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * Get the cabinet associated with the schedule.
     */
    public function cabinet(): BelongsTo
    {
        return $this->belongsTo(Cabinet::class);
    }
}
