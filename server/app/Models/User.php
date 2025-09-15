<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'email',
        'password',
        'role',
        'is_active',
        'profile_image',
        'email_verified_at',
        'verification_code',
        'verification_code_expires_at',
        'expires_at'
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'verification_code',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'verification_code_expires_at' => 'datetime',
        ];
    }

     /**
     * Relation avec le profil médecin si l'utilisateur est un médecin
     */
    public function doctor()
    {
        return $this->hasOne( Doctor::class);
    }

    /**
     * Relation avec les cabinets possédés par cet utilisateur
     */
    public function ownedCabinets()
    {
        return $this->hasMany(Cabinet::class, 'owner_id');
    }

    /**
     * Vérifier si l'utilisateur est un médecin
     */
    public function isDoctor(): bool
    {
        return $this->role === 'doctor';
    }

    /**
     * Vérifier si l'utilisateur est un patient
     */
    public function isPatient(): bool
    {
        return $this->role === 'patient';
    }

    /**
     * Vérifier si l'utilisateur est un admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Scope pour récupérer les utilisateurs actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour récupérer les utilisateurs par rôle
     */
    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }
}
