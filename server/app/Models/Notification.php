<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'reservation_id',
        'title',
        'message',
        'type',
        'send_email',
        'send_push',
        'is_read',
        'read_at',
        'sent_at',
        'delivery_status',
        'priority',
        'scheduled_for',
        'data',
        'action_url',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'send_email' => 'boolean',
        'send_push' => 'boolean',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'sent_at' => 'datetime',
        'scheduled_for' => 'datetime',
        'delivery_status' => 'array', // JSON cast to array
        'data' => 'array', // JSON cast to array
        'type' => 'string',
        'priority' => 'string',
    ];

    /**
     * Get the user that owns the notification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the reservation associated with the notification.
     */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}
