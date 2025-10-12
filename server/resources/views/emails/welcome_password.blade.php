@component('mail::message')
# Welcome, {{ $name }}!

Your account has been created. Below is your account password:

**Password**: {{ $password }}

Please log in using this password. You can change it anytime in your account settings.

@component('mail::button', ['url' => url('/login')])
Log In
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
