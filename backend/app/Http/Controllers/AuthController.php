<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            $request->validate([
                'username' => 'required|string|min:3|max:20'
            ]);

            $user = User::where('username', $request->username)->first();

            if ($user) {
                $user->is_online = true;
                $user->last_active = now();
                $user->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Login berhasil!',
                    'user' => [
                        'id' => $user->id,
                        'username' => $user->username,
                        'credits' => $user->credits,
                        'is_admin' => $user->is_admin ?? false
                    ]
                ]);
            }

            $isAdmin = ($request->username === 'admin');

            $newUser = User::create([
                'username' => $request->username,
                'password' => bcrypt('default'), // ✅ Pakai bcrypt
                'credits' => 1000,
                'is_admin' => $isAdmin,
                'is_online' => true,
                'total_bets' => 0,
                'total_wins' => 0,
                'total_losses' => 0,
                'last_active' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Akun baru berhasil dibuat!',
                'user' => [
                    'id' => $newUser->id,
                    'username' => $newUser->username,
                    'credits' => $newUser->credits,
                    'is_admin' => $newUser->is_admin
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage(),
                'error' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $request->validate([
            'username' => 'required|string'
        ]);

        $user = User::where('username', $request->username)->first();

        if ($user) {
            $user->is_online = false;
            $user->save();
        }

        return response()->json(['success' => true]);
    }

    public function adminLogin(Request $request)
    {
        try {
            $request->validate([
                'password' => 'required|string'
            ]);

            // Ambil admin user dari database
            $admin = User::where('is_admin', true)->first();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin tidak ditemukan!'
                ], 404);
            }

            // ✅ Verifikasi password dengan Hash::check
            if (Hash::check($request->password, $admin->password)) {
                return response()->json([
                    'success' => true,
                    'message' => 'Login admin berhasil!',
                    'admin' => [
                        'id' => $admin->id,
                        'username' => $admin->username
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Password salah!'
                ], 401);
            }

        } catch (\Exception $e) {
            \Log::error('Admin login error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function changePassword(Request $request)
    {
        try {
            $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6',
                'new_password_confirmation' => 'required|string|same:new_password'
            ]);

            // Ambil admin user
            $admin = User::where('is_admin', true)->first();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin tidak ditemukan!'
                ], 404);
            }

            // ✅ Cek password lama dengan Hash::check
            if (!Hash::check($request->current_password, $admin->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password lama salah!'
                ], 401);
            }

            // ✅ Update password baru dengan Hash::make
            $admin->password = Hash::make($request->new_password);
            $admin->save();

            return response()->json([
                'success' => true,
                'message' => 'Password berhasil diubah!'
            ]);

        } catch (\Exception $e) {
            \Log::error('Change password error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }


    // Di AuthController.php
    public function promoteToAdmin($userId)
    {
        try {
            $user = User::find($userId);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan!'
                ], 404);
            }

            if ($user->is_admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'User sudah menjadi admin!'
                ], 400);
            }

            $user->is_admin = true;
            $user->save();

            // ✅ Refresh data dari database
            $user->refresh();

            return response()->json([
                'success' => true,
                'message' => 'User berhasil dipromosikan menjadi admin!',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'is_admin' => $user->is_admin, // ✅ Pastikan nilai ini true
                    'credits' => $user->credits
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Promote user error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function demoteFromAdmin($userId)
    {
        try {
            $user = User::find($userId);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan!'
                ], 404);
            }

            if (!$user->is_admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'User bukan admin!'
                ], 400);
            }

            $adminCount = User::where('is_admin', true)->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak bisa demote! Harus ada minimal 1 admin.'
                ], 400);
            }

            $user->is_admin = false;
            $user->save();

            // ✅ Refresh data dari database
            $user->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Admin berhasil diturunkan menjadi user biasa!',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'is_admin' => $user->is_admin, // ✅ Pastikan nilai ini false
                    'credits' => $user->credits
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Demote admin error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }



}