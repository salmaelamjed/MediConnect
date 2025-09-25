@component('mail::message')
# Appointment Rescheduled

Dear {{ $reservation->patient->name }},

Your appointment with Dr. {{ $doctorName }} has been rescheduled.

**New Appointment Details:**
- **Date**: {{ $date }}
- **Time**: {{ $time }}
- **Location**: {{ $cabinetName }}, {{ $cabinetAddress }}
- **Reason**: {{ $reservation->reason ?? 'Not specified' }}

Please arrive 10 minutes early. If you have any questions, contact our office or use our platform.

Best regards,
Your Healthcare Team

@component('mail::button', ['url' => url('/reservations/' . $reservation->id)])
View Appointment
@endcomponent
@endcomponent
