<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Doctor extends Model
{

    protected $fillable = [
        'user_id',
        'name',
        'specialite',
        'bio',
        'license_number',
        'cabinet_name',
        'cabinet_address',
        'cabinet_city',
        'cabinet_postal_code',
        'heure_ouverture',
        'heure_fermeture',
        'jours_travail',
         'consultation_fees',
        'latitude',
        'longitude',

    ];

    protected $casts = [
        'jours_travail' => 'array',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8'
    ];

        // Calculer la distance entre deux points (en km)
    public static function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));

        return $earthRadius * $c;
    }

      // Scope pour rechercher par proximité
    public function scopeNearby($query, $latitude, $longitude, $radius = 10)
    {
        return $query->selectRaw("
            *,
            (6371 * acos(
                cos(radians(?))
                * cos(radians(latitude))
                * cos(radians(longitude) - radians(?))
                + sin(radians(?))
                * sin(radians(latitude))
            )) AS distance
        ", [$latitude, $longitude, $latitude])
        ->having('distance', '<=', $radius)
        ->orderBy('distance');
    }
}
