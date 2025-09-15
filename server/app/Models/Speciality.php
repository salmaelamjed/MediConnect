<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Speciality extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'icon',
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
            'is_active' => 'boolean',
        ];
    }

    /**
     * Relation avec les médecins de cette spécialité
     */
    public function doctors(): HasMany
    {
        return $this->hasMany(Doctor::class);
    }

    /**
     * Relation many-to-many avec les cabinets qui proposent cette spécialité
     */
    public function cabinets(): BelongsToMany
    {
        return $this->belongsToMany(Cabinet::class, 'cabinet_specialities')
                    ->withTimestamps();
    }

    /**
     * Scope pour récupérer les spécialités actives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Compter le nombre de médecins dans cette spécialité
     */
    public function getDoctorsCountAttribute(): int
    {
        return $this->doctors()->where('is_active', true)->count();
    }

    /**
     * Compter le nombre de cabinets proposant cette spécialité
     */
    public function getCabinetsCountAttribute(): int
    {
        return $this->cabinets()->where('is_active', true)->count();
    }

}
