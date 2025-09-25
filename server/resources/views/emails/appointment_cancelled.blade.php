@component('mail::message')
# Appointment Cancellation

Dear {{ $reservation->patient->name }},

We regret to inform you that your appointment with Dr. {{ $doctorName }} has been canceled.

**Appointment Details:**
- **Date**: {{ $date }}
- **Time**: {{ $time }}
- **Location**: {{ $cabinetName }}
- **Reason for Cancellation**: {{ $reason }}

If you have any questions or wish to reschedule, please contact our office or use our platform.

Best regards,
Your Healthcare Team

@component('mail::button', ['url' => url('/reservations')])
Book a New Appointment
@endcomponent
@endcomponent
