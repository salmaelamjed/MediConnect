@component('mail::message')
# Appointment Confirmation

Dear {{ $reservation->patient->name }},

We are pleased to confirm your appointment with Dr. {{ $doctorName }}.

**Appointment Details:**
- **Date**: {{ $date }}
- **Time**: {{ $time }}
- **Location**: {{ $cabinetName }}, {{ $cabinetAddress }}
- **Reason**: {{ $reservation->reason ?? 'Not specified' }}

Please arrive 10 minutes early to complete any necessary paperwork. If you need to reschedule or cancel, you can do so through our platform or by contacting our office.

Thank you for choosing our services.

Best regards,
Your Healthcare Team

@component('mail::button', ['url' => url('/reservations/' . $reservation->id)])
View Appointment
@endcomponent
@endcomponent
