<?php

namespace App\Mail;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class AppointmentConfirmed extends Mailable
{
    use Queueable, SerializesModels;

    public $reservation;

    /**
     * Create a new message instance.
     */
    public function __construct(Reservation $reservation)
    {
        $this->reservation = $reservation;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Appointment Confirmation'
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment_confirmed',
            with: [
                'reservation' => $this->reservation,
                'doctorName' => $this->reservation->doctor->name,
                'date' => \Carbon\Carbon::parse($this->reservation->reservation_date)->format('d/m/Y'),
                'time' => \Carbon\Carbon::parse($this->reservation->reservation_time)->format('H:i'),
                'cabinetName' => $this->reservation->cabinet->name,
                'cabinetAddress' => $this->reservation->cabinet->address . ', ' . $this->reservation->cabinet->city . ', ' . $this->reservation->cabinet->postal_code
            ]
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
