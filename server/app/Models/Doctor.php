<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Doctor extends Model
{
     use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'user_id',
        'name',
        'bio',
        'license_number',
        'cabinet_name',
        'cabinet_address',
        'cabinet_city',
        'cabinet_postal_code',
        'latitude',
        'longitude',
        'consultation_fees',
    ];
}
