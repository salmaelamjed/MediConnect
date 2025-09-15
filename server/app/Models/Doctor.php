<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Doctor extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'speciality_id',
        'cabinet_id',
        'name',
        'license_number',
        'bio',
        'consultation_fees',
        'start_time',
        'end_time',
        'available_days',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'available_days' => 'array',
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'consultation_fees' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Relation avec l'utilisateur associé
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec la spécialité du médecin
     */
    public function speciality(): BelongsTo
    {
        return $this->belongsTo(Speciality::class);
    }

    /**
     * Relation avec le cabinet (optionnelle)
     */
    public function cabinet(): BelongsTo
    {
        return $this->belongsTo(Cabinet::class);
    }

    /**
     * Scope pour récupérer les médecins actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour récupérer les médecins vérifiés
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Scope pour filtrer par spécialité
     */
    public function scopeBySpeciality($query, $specialityId)
    {
        return $query->where('speciality_id', $specialityId);
    }

    /**
     * Scope pour filtrer par cabinet
     */
    public function scopeByCabinet($query, $cabinetId)
    {
        return $query->where('cabinet_id', $cabinetId);
    }

    /**
     * Scope pour les médecins qui acceptent les réservations en ligne
     */
    public function scopeAcceptingOnlineBooking($query)
    {
        return $query->where('accepts_online_booking', true);
    }

    /**
     * Scope pour rechercher dans une ville spécifique via le cabinet
     */
    public function scopeInCity($query, $city)
    {
        return $query->whereHas('cabinet', function ($q) use ($city) {
            $q->where('city', 'like', "%{$city}%");
        });
    }

    /**
     * Scope pour rechercher dans un rayon géographique via le cabinet
     */
    public function scopeWithinRadius($query, $latitude, $longitude, $radius = 10)
    {
        return $query->whereHas('cabinet', function ($q) use ($latitude, $longitude, $radius) {
            $q->selectRaw("
                *,
                (6371 * acos(
                    cos(radians(?)) *
                    cos(radians(latitude)) *
                    cos(radians(longitude) - radians(?)) +
                    sin(radians(?)) *
                    sin(radians(latitude))
                )) AS distance
            ", [$latitude, $longitude, $latitude])
            ->having('distance', '<=', $radius);
        });
    }

    /**
     * Obtenir le nom complet avec la spécialité
     */
    public function getFullNameWithSpecialityAttribute(): string
    {
        $speciality = $this->speciality ? $this->speciality->name : 'Médecin généraliste';
        return "Dr. {$this->name} - {$speciality}";
    }

    /**
     * Vérifier si le médecin travaille aujourd'hui
     */
    public function isAvailableToday(): bool
    {
        $today = strtolower(now()->format('l'));

        // Traduction des jours en français
        $dayTranslation = [
            'monday' => 'lundi',
            'tuesday' => 'mardi',
            'wednesday' => 'mercredi',
            'thursday' => 'jeudi',
            'friday' => 'vendredi',
            'saturday' => 'samedi',
            'sunday' => 'dimanche'
        ];

        $frenchDay = $dayTranslation[$today] ?? $today;

        return in_array($frenchDay, $this->available_days ?? []);
    }

    /**
     * Vérifier si le médecin est disponible maintenant
     */
    public function isAvailableNow(): bool
    {
        if (!$this->isAvailableToday()) {
            return false;
        }

        $currentTime = now()->format('H:i');
        $startTime = $this->start_time ? $this->start_time->format('H:i') : null;
        $endTime = $this->end_time ? $this->end_time->format('H:i') : null;

        if ($startTime && $endTime) {
            return $currentTime >= $startTime && $currentTime <= $endTime;
        }

        return true;
    }

    /**
     * Obtenir l'adresse via le cabinet
     */
    public function getAddressAttribute(): ?string
    {
        return $this->cabinet ? $this->cabinet->full_address : null;
    }

    /**
     * Obtenir les coordonnées GPS via le cabinet
     */
    public function getCoordinatesAttribute(): ?array
    {
        if ($this->cabinet) {
            return [
                'latitude' => $this->cabinet->latitude,
                'longitude' => $this->cabinet->longitude
            ];
        }
        return null;
    }
}
