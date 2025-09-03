<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\ResetPassword;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    /**
     * Send password reset code to user's email
     */
    public function sendResetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::where('email', $request->email)->first();

            // Générer un code numérique aléatoire de 6 chiffres
            $resetCode = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
            $expiresAt = Carbon::now()->addMinutes(15); // Code expire dans 15 minutes

            // Supprimer les codes de réinitialisation existants pour cet email
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();

            // Insérer le nouveau code de réinitialisation
            DB::table('password_reset_tokens')->insert([
                'email' => $user->email,
                'token' => Hash::make($resetCode), // Hasher le code pour la sécurité
                'expires_at' => $expiresAt,
                'created_at' => now(),
            ]);

            // Envoyer l'email avec le code de réinitialisation
            try {
                Log::info('Envoi du code de réinitialisation à l\'email: ' . $user->email);
                Mail::to($user->email)->send(new ResetPassword($user->email, $resetCode));
                Log::info('Email de réinitialisation envoyé avec succès');
            } catch (\Exception $e) {
                Log::error('Échec de l\'envoi de l\'email: ' . $e->getMessage());
                throw new \Exception('Échec de l\'envoi de l\'email: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Code de réinitialisation envoyé avec succès. Vérifiez votre email.',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Échec de l\'envoi du code de réinitialisation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


/**
 * Resend password reset code to user's email
 */
        public function resendPasswordCode(Request $request)
        {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|exists:users,email',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'errors' => $validator->errors(),
                ], 422);
            }

            try {
                $user = User::where('email', $request->email)->first();

                // Vérifier s'il existe déjà un code de réinitialisation récent
                $existingReset = DB::table('password_reset_tokens')
                    ->where('email', $user->email)
                    ->first();

                // Vérifier la limite de temps pour le renvoi (exemple: 2 minutes minimum entre les envois)
                if ($existingReset) {
                    $lastSent = Carbon::parse($existingReset->created_at);
                    $minWaitTime = 2; // minutes

                    if (Carbon::now()->diffInMinutes($lastSent) < $minWaitTime) {
                        $remainingTime = $minWaitTime - Carbon::now()->diffInMinutes($lastSent);
                        return response()->json([
                            'message' => "Veuillez attendre {$remainingTime} minute(s) avant de redemander un code.",
                            'wait_time' => $remainingTime,
                        ], 429); 
                    }
                }

                // Générer un nouveau code numérique aléatoire de 6 chiffres
                $resetCode = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
                $expiresAt = Carbon::now()->addMinutes(15); // Code expire dans 15 minutes

                // Supprimer les codes de réinitialisation existants pour cet email
                DB::table('password_reset_tokens')->where('email', $user->email)->delete();

                // Insérer le nouveau code de réinitialisation
                DB::table('password_reset_tokens')->insert([
                    'email' => $user->email,
                    'token' => Hash::make($resetCode), // Hasher le code pour la sécurité
                    'expires_at' => $expiresAt,
                    'created_at' => now(),
                ]);

                // Envoyer l'email avec le nouveau code de réinitialisation
                try {
                    Log::info('Renvoi du code de réinitialisation à l\'email: ' . $user->email);
                    Mail::to($user->email)->send(new ResetPassword($user->email, $resetCode));
                    Log::info('Email de réinitialisation renvoyé avec succès');
                } catch (\Exception $e) {
                    Log::error('Échec du renvoi de l\'email: ' . $e->getMessage());
                    throw new \Exception('Échec du renvoi de l\'email: ' . $e->getMessage());
                }

                return response()->json([
                    'message' => 'Nouveau code de réinitialisation envoyé avec succès. Vérifiez votre email.',
                    'expires_in_minutes' => 15,
                ], 200);

            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Échec du renvoi du code de réinitialisation',
                    'error' => $e->getMessage(),
                ], 500);
            }
        }

    /**
     * Validate the reset code
     */
    public function validateResetCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string|size:6', // Code de 6 chiffres
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Rechercher le code de réinitialisation
            $passwordReset = DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->first();

            if (!$passwordReset) {
                return response()->json([
                    'message' => 'Code invalide ou expiré',
                ], 400);
            }

            // Vérifier si le code est valide
            if (!Hash::check($request->code, $passwordReset->token)) {
                return response()->json([
                    'message' => 'Code invalide',
                ], 400);
            }

            // Vérifier si le code a expiré
            if (Carbon::now()->greaterThan(Carbon::parse($passwordReset->expires_at))) {
                DB::table('password_reset_tokens')->where('email', $request->email)->delete();
                return response()->json([
                    'message' => 'Code expiré',
                ], 400);
            }

            return response()->json([
                'message' => 'Code valide',
                'valid' => true,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la validation du code',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Change password after code validation
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'password' => 'required|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Rechercher le code de réinitialisation
            $passwordReset = DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->first();

            if (!$passwordReset) {
                return response()->json([
                    'message' => 'Code invalide ou expiré',
                ], 400);
            }



            // Vérifier si le code a expiré
            if (Carbon::now()->greaterThan(Carbon::parse($passwordReset->expires_at))) {
                DB::table('password_reset_tokens')->where('email', $request->email)->delete();
                return response()->json([
                    'message' => 'Code expiré',
                ], 400);
            }

            // Mettre à jour le mot de passe de l'utilisateur
            $user = User::where('email', $request->email)->first();
            $user->update([
                'password' => Hash::make($request->password),
            ]);

            // Supprimer le code de réinitialisation utilisé
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json([
                'message' => 'Mot de passe modifié avec succès',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Échec de la modification du mot de passe',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
