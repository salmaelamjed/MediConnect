<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CabinetController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PlanningController;
use App\Http\Controllers\Api\SchedulesController;
use App\Http\Controllers\Api\SpecialityController;
use App\Http\Controllers\Api\CabinetSearchController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\UserController; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerificationCode']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
});

// Password reset routes
Route::prefix('password-reset')->group(function () {
    Route::post('/send-code', [PasswordResetController::class, 'sendResetPassword'])
        ->name('password.reset.send');
    Route::post('/validate-code', [PasswordResetController::class, 'validateResetCode'])
        ->name('password.reset.validate');
    Route::post('/change-password', [PasswordResetController::class, 'changePassword'])
        ->name('password.reset.change');
    Route::post('/resend-code', [PasswordResetController::class, 'resendPasswordCode']);
});

// Specialities routes
Route::get('/specialities', [SpecialityController::class, 'allSpecialities']);
Route::get('/specialities/active', [SpecialityController::class, 'allSpecialitiesActive']);

// Cabinet routes
Route::get('/cabinets/active', [CabinetController::class, 'allCabinetsActive'])->name('cabinets.active');
Route::get('/cabinets', [CabinetController::class, 'allCabinets'])->name('cabinets.all');
Route::get('/cabinets/name/{name}', [CabinetController::class, 'getCabinetByName'])->name('cabinets.byName');
Route::get('/cabinets/address/{address}', [CabinetController::class, 'getCabinetByAdress'])->name('cabinets.byAddress');

// Search routes
Route::get('/search', [SearchController::class, 'search']);
Route::prefix('search')->group(function () {
    Route::get('/cabinets', [CabinetSearchController::class, 'search']);
    Route::get('/cabinets/location', [CabinetSearchController::class, 'searchByLocation']);
    Route::get('/cabinets/advanced', [CabinetSearchController::class, 'advancedSearch']);
    Route::get('/cities', [CabinetSearchController::class, 'getCities']);
});

// Additional filter routes
Route::get('/cabinets/open-now', [CabinetSearchController::class, 'getOpenNow']);
Route::get('/cabinets/available', [CabinetSearchController::class, 'getAvailable']);
Route::get('/cabinets/nearest', [CabinetSearchController::class, 'getNearest']);
Route::get('/cabinets/{id}', [CabinetController::class, 'show']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users', [UserController::class, 'index']); // Get all users (admin only)
    Route::get('/user', [UserController::class, 'show']); // Get authenticated user details
    Route::put('/user', [UserController::class, 'update']); // Update authenticated user
    Route::put('/users/{id}/role', [UserController::class, 'updateRole']); // Update user role (admin only)
    Route::delete('/users/{id}', [UserController::class, 'destroy']); // Delete user (admin only)

    // Reservation routes
    Route::get('/reservations', [ReservationController::class, 'index'])->name('reservations.index');
    Route::post('/reservations', [ReservationController::class, 'store'])->name('reservations.store');
    Route::get('/reservations/{id}', [ReservationController::class, 'show'])->name('reservations.show');
    Route::post('/reservations/{id}/confirm', [ReservationController::class, 'confirm'])->name('reservations.confirm');
    Route::post('/reservations/{id}/cancel', [ReservationController::class, 'cancel'])->name('reservations.cancel');
    Route::post('/reservations/{id}/complete', [ReservationController::class, 'complete'])->name('reservations.complete');
    Route::put('/reservations/{id}/reschedule', [ReservationController::class, 'reschedule'])->name('reservations.reschedule');
    Route::post('/reservations/{id}/reminder', [ReservationController::class, 'sendReminder'])->name('reservations.reminder');
    Route::get('/reservations/stats', [ReservationController::class, 'getStats'])->name('reservations.stats');
    Route::get('/doctors/{doctorId}/available-slots', [ReservationController::class, 'getAvailableSlots'])->name('reservations.available-slots');
    Route::delete('/reservations/{id}', [ReservationController::class, 'destroy']);

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    Route::put('/notifications/{notificationId}/read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-as-read');

    // Patient routes
    Route::apiResource('patients', PatientController::class);
    Route::get('patients-by-doctor', [PatientController::class, 'patientsByDoctor']);

    // Staff routes
    Route::apiResource('staff', StaffController::class)->except(['store']);
    Route::post('/cabinets/{cabinetId}/staff', [StaffController::class, 'store'])->name('staff.store');
    Route::get('staff/me', [StaffController::class, 'me']);

    // Schedule routes
    Route::get('/schedules', [PlanningController::class, 'getDoctorPlanning']);
    Route::get('/debug-planning', [PlanningController::class, 'debugPlanning']);
});
