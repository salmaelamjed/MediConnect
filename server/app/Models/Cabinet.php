<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Cabinet extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'owner_id',
        'name',
        'description',
        'image',
        'address',
        'city',
        'postal_code',
        'email',
        'opening_time',
        'closing_time',
        'working_days',
        'latitude',
        'longitude',
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
            'working_days' => 'array',
            'opening_time' => 'datetime:H:i',
            'closing_time' => 'datetime:H:i',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Relation avec le propriétaire du cabinet
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Relation avec les médecins travaillant dans ce cabinet
     */
    public function doctors(): HasMany
    {
        return $this->hasMany(Doctor::class);
    }

    /**
     * Relation many-to-many avec les spécialités proposées dans ce cabinet
     */
    public function specialities(): BelongsToMany
    {
        return $this->belongsToMany(Speciality::class, 'cabinet_specialities')
                    ->withTimestamps();
    }

    /**
     * Scope pour récupérer les cabinets actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour rechercher par ville
     */
    public function scopeByCity($query, $city)
    {
        return $query->where('city', 'like', "%{$city}%");
    }

    /**
     * Scope pour rechercher dans un rayon géographique
     */
    public function scopeWithinRadius($query, $latitude, $longitude, $radius = 10)
    {
        return $query->selectRaw("
            *,
            (6371 * acos(
                cos(radians(?)) *
                cos(radians(latitude)) *
                cos(radians(longitude) - radians(?)) +
                sin(radians(?)) *
                sin(radians(latitude))
            )) AS distance
        ", [$latitude, $longitude, $latitude])
        ->having('distance', '<=', $radius)
        ->orderBy('distance');
    }

    /**
     * Obtenir l'adresse complète
     */
    public function getFullAddressAttribute(): string
    {
        return "{$this->address}, {$this->postal_code} {$this->city}";
    }

    /**
     * Compter le nombre de médecins actifs dans le cabinet
     */
    public function getActiveDoctorsCountAttribute(): int
    {
        return $this->doctors()->where('is_active', true)->count();
    }

    /**
     * Vérifier si le cabinet est ouvert maintenant
     */
    public function isOpenNow(): bool
    {
        $now = now();
        $currentDay = strtolower($now->format('l')); // lundi, mardi, etc.
        $currentTime = $now->format('H:i');

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

        $frenchDay = $dayTranslation[$currentDay] ?? $currentDay;

        // Vérifier si c'est un jour ouvrable
        if (!in_array($frenchDay, $this->working_days ?? [])) {
            return false;
        }

        // Vérifier l'heure
        $openingTime = $this->opening_time ? $this->opening_time->format('H:i') : null;
        $closingTime = $this->closing_time ? $this->closing_time->format('H:i') : null;

        if ($openingTime && $closingTime) {
            return $currentTime >= $openingTime && $currentTime <= $closingTime;
        }

        return true; // Si pas d'heures spécifiées, considérer comme ouvert
    }
}
