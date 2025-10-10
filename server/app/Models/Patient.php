<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Patient extends Model
{

    protected $fillable = [
        'user_id',
        'name',
        'profile',
        'date_of_birth',
        'gender',
        'address',
        'city',
        'code_postal',
        'medical_history',
        'allergies',
    ];
    /**
     * Relation avec l'utilisateur associé (1:1)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
