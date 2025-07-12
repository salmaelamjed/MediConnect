<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;
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
});
