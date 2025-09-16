<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CabinetController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\SpecialityController;
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

