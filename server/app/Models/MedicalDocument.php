<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalDocument extends Model
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
        'title',
        'description',
        'type',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'mime_type',
        'is_sensitive',
        'access_permissions',
        'encryption_key',
        'issued_date',
        'expires_at',
        'is_active',
        'download_count',
        'last_accessed_at',
        'shared_with_patient',
        'tags',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_sensitive' => 'boolean',
        'shared_with_patient' => 'boolean',
        'is_active' => 'boolean',
        'issued_date' => 'date',
        'expires_at' => 'date',
        'last_accessed_at' => 'datetime',
        'access_permissions' => 'array', // JSON cast to array
        'tags' => 'array', // JSON cast to array
        'file_size' => 'integer',
        'download_count' => 'integer',
        'type' => 'string',
    ];

    /**
     * Get the patient that owns the medical document.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the doctor that owns the medical document.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * Get the reservation associated with the medical document.
     */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}
