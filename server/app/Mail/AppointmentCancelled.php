<?php

namespace App\Mail;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class AppointmentCancelled extends Mailable
{
    use Queueable, SerializesModels;

    public $reservation;

    public function __construct(Reservation $reservation)
    {
        $this->reservation = $reservation;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Appointment Cancellation'
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment_cancelled',
            with: [
                'reservation' => $this->reservation,
                'doctorName' => $this->reservation->doctor->name,
                'date' => \Carbon\Carbon::parse($this->reservation->reservation_date)->format('d/m/Y'),
                'time' => \Carbon\Carbon::parse($this->reservation->reservation_time)->format('H:i'),
                'cabinetName' => $this->reservation->cabinet->name,
                'reason' => $this->reservation->cancellation_reason ?? 'Not specified'
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
