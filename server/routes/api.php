<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CabinetController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\SpecialityController;
use App\Http\Controllers\Api\CabinetSearchController;
use App\Http\Controllers\Api\ReservationController;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerificationCode']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
});

// Groupe de routes pour la réinitialisation de mot de passe
Route::prefix('password-reset')->group(function () {
    Route::post('/send-code', [PasswordResetController::class, 'sendResetPassword'])
        ->name('password.reset.send');
    Route::post('/validate-code', [PasswordResetController::class, 'validateResetCode'])
        ->name('password.reset.validate');
    Route::post('/change-password', [PasswordResetController::class, 'changePassword'])
        ->name('password.reset.change');
    Route::post('/resend-code', [PasswordResetController::class, 'resendPasswordCode']);
});
//route for specialities
Route::get('/specialities',[SpecialityController::class, 'allSpecialities']);
Route::get('/specialities/active', [SpecialityController::class, 'allSpecialitiesActive']);


//route for cabinets
Route::get('/cabinets/active', [CabinetController::class, 'allCabinetsActive'])->name('cabinets.active');
Route::get('/cabinets', [CabinetController::class, 'allCabinets'])->name('cabinets.all');
Route::get('/cabinets/name/{name}', [CabinetController::class, 'getCabinetByName'])->name('cabinets.byName');
Route::get('/cabinets/address/{address}', [CabinetController::class, 'getCabinetByAdress'])->name('cabinets.byAddress');

// routes/api.php
Route::prefix('search')->group(function () {
    Route::get('/cabinets', action: [CabinetSearchController::class, 'search']);
    Route::get('/cabinets/location', [CabinetSearchController::class, 'searchByLocation']);
    Route::get('/cabinets/advanced', [CabinetSearchController::class, 'advancedSearch']);
    Route::get('/cities', [CabinetSearchController::class, 'getCities']);
});
// Routes supplémentaires pour les filtres
Route::get('/cabinets/open-now', [CabinetSearchController::class, 'getOpenNow']);
Route::get('/cabinets/available', [CabinetSearchController::class, 'getAvailable']);
Route::get('/cabinets/nearest', [CabinetSearchController::class, 'getNearest']);



Route::middleware('auth:sanctum')->group(function () {

    // List all reservations (accessible by patients, doctors, admins)
    // GET /api/reservations
    Route::get('/reservations', [ReservationController::class, 'index'])
        ->name('reservations.index');

    // Create a new reservation (patients only)
    // POST /api/reservations
    Route::post('/reservations', [ReservationController::class, 'store'])
        ->name('reservations.store');

    // View a specific reservation (patients, doctors, admins)
    // GET /api/reservations/{id}
    Route::get('/reservations/{id}', [ReservationController::class, 'show'])
        ->name('reservations.show');

    // Confirm a reservation (doctors only)
    // POST /api/reservations/{id}/confirm
    Route::post('/reservations/{id}/confirm', [ReservationController::class, 'confirm'])
        ->name('reservations.confirm');

    // Cancel a reservation (patients, doctors, admins)
    // POST /api/reservations/{id}/cancel
    Route::post('/reservations/{id}/cancel', [ReservationController::class, 'cancel'])
        ->name('reservations.cancel');

    // Mark a reservation as completed (doctors only)
    // POST /api/reservations/{id}/complete
    Route::post('/reservations/{id}/complete', [ReservationController::class, 'complete'])
        ->name('reservations.complete');

    // Reschedule a reservation (patients, doctors, admins)
    // PUT /api/reservations/{id}/reschedule
    Route::put('/reservations/{id}/reschedule', [ReservationController::class, 'reschedule'])
        ->name('reservations.reschedule');

    // Send a reminder for a reservation (doctors, admins)
    // POST /api/reservations/{id}/reminder
    Route::post('/reservations/{id}/reminder', [ReservationController::class, 'sendReminder'])
        ->name('reservations.reminder');

    // Get reservation statistics (doctors, admins)
    // GET /api/reservations/stats
    Route::get('/reservations/stats', [ReservationController::class, 'getStats'])
        ->name('reservations.stats');

    // Get available slots for a doctor (accessible by authenticated users)
    // GET /api/doctors/{doctorId}/available-slots
    Route::get('/doctors/{doctorId}/available-slots', [ReservationController::class, 'getAvailableSlots'])
        ->name('reservations.available-slots');
    Route::delete('/reservations/{id}', [ReservationController::class, 'destroy']);
});
