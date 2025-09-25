<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'reservation_id',
        'cabinet_id',
        'overall_rating',
        'facility_rating',
        'review_text',
        'would_recommend',
        'status',
        'moderation_notes',
        'moderated_by',
        'moderated_at',
        'doctor_response',
        'doctor_responded_at',
        'is_verified',
        'is_anonymous',
        'helpful_votes',
        'total_votes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'overall_rating' => 'integer',
        'facility_rating' => 'integer',
        'would_recommend' => 'boolean',
        'is_verified' => 'boolean',
        'is_anonymous' => 'boolean',
        'moderated_at' => 'datetime',
        'doctor_responded_at' => 'datetime',
        'helpful_votes' => 'integer',
        'total_votes' => 'integer',
        'status' => 'string',
    ];

    /**
     * Get the patient that owns the review.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the doctor that owns the review.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * Get the reservation associated with the review.
     */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    /**
     * Get the cabinet associated with the review.
     */
    public function cabinet(): BelongsTo
    {
        return $this->belongsTo(Cabinet::class);
    }

    /**
     * Get the user who moderated the review.
     */
    public function moderator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }
}
