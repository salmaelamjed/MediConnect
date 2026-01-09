<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class ResetPassword extends Mailable
{
    use Queueable, SerializesModels;

    public $email;
    public $resetCode;

    /**
     * Create a new message instance.
     */
    public function __construct($email, $resetCode)
    {
        $this->email = $email;
        $this->resetCode = $resetCode;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Code de réinitialisation de mot de passe')
                    ->view('emails.reset_password')
                    ->with([
                        'resetCode' => $this->resetCode,
                        'email' => $this->email
                    ]);
    }
}
