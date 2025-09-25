@component('mail::message')
# Appointment Reminder

Dear {{ $reservation->patient->name }},

This is a reminder for your upcoming appointment with Dr. {{ $doctorName }}.

**Appointment Details:**
- **Date**: {{ $date }}
- **Time**: {{ $time }}
- **Location**: {{ $cabinetName }}, {{ $cabinetAddress }}
- **Reason**: {{ $reservation->reason ?? 'Not specified' }}

Please arrive 10 minutes early. If you need to reschedule or cancel, please do so through our platform or contact our office.

Best regards,
Your Healthcare Team

@component('mail::button', ['url' => url('/reservations/' . $reservation->id)])
View Appointment
@endcomponent
@endcomponent
