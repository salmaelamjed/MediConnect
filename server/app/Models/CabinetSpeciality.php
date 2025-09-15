<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CabinetSpeciality extends Model
{
    protected $fillable = [
        'cabinet_id',
        'speciality_id',
    ];

    // Optionally, define relationships
    public function cabinet()
    {
        return $this->belongsTo(Cabinet::class);
    }

    public function speciality()
    {
        return $this->belongsTo(Speciality::class);
    }
}
