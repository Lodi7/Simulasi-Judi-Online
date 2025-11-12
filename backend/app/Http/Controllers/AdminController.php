<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Events\UserCreditsUpdated;
use App\Events\UserStatsUpdated;
use App\Events\WinChanceChanged;
use App\Events\CustomWinChanceUpdated;
use App\Events\UserReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    /**
     * Get all users dengan info custom win chance
     */
    public function getUsers()
    {
        try {
            $globalWinChance = cache()->get('win_chance', 50);

            $users = User::all()->map(function ($user) use ($globalWinChance) {
                return [
                    'id' => $user->id,
                    'username' => $user->username,
                    'credits' => $user->credits ?? 0,
                    'is_admin' => (bool) $user->is_admin,
                    'is_online' => $user->is_online ?? false,
                    'total_bets' => $user->total_bets ?? 0,
                    'total_wins' => $user->total_wins ?? 0,
                    'total_losses' => $user->total_losses ?? 0,
                    'last_active' => $user->last_active,
                    // 🔥 TAMBAHAN: Info custom win chance
                    'custom_win_chance' => $user->custom_win_chance,
                    'effective_win_chance' => $user->getEffectiveWinChance(),
                    'uses_custom' => $user->custom_win_chance !== null,
                ];
            });

            return response()->json($users);
        } catch (\Exception $e) {
            Log::error("Get users error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update GLOBAL win chance
     * Hanya affect user yang tidak punya custom win chance
     */
    public function updateWinChance(Request $request)
    {
        try {
            $request->validate([
                'win_chance' => 'required|integer|min:0|max:100'
            ]);

            $winChance = $request->win_chance;

            // Update global win chance di cache
            cache()->put('win_chance', $winChance, now()->addDays(30));

            // Broadcast ke semua user yang menggunakan global win chance
            broadcast(new WinChanceChanged($winChance));

            Log::info("Global win chance updated to {$winChance}%");

            return response()->json([
                'success' => true,
                'win_chance' => $winChance,
                'message' => 'Global win chance updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error("Update win chance error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update global win chance DAN reset semua custom win chance
     * Semua user akan menggunakan global win chance yang baru
     */
    public function updateGlobalWinChance(Request $request)
    {
        try {
            $request->validate([
                'win_chance' => 'required|integer|min:0|max:100',
                'reset_custom' => 'boolean'
            ]);

            $winChance = $request->win_chance;
            $resetCustom = $request->reset_custom ?? false;

            // Update global win chance
            cache()->put('win_chance', $winChance, now()->addDays(30));

            // Jika diminta reset custom, set semua custom win chance ke null
            if ($resetCustom) {
                $usersWithCustom = User::whereNotNull('custom_win_chance')->get();

                User::whereNotNull('custom_win_chance')->update([
                    'custom_win_chance' => null
                ]);

                // Broadcast ke setiap user yang di-reset
                foreach ($usersWithCustom as $user) {
                    broadcast(new CustomWinChanceUpdated(
                        $user->id,
                        $user->username,
                        null
                    ));
                }

                Log::info("Global win chance updated to {$winChance}% and all custom rates reset");
            } else {
                Log::info("Global win chance updated to {$winChance}%");
            }

            // Broadcast global win chance change
            broadcast(new WinChanceChanged($winChance));

            return response()->json([
                'success' => true,
                'win_chance' => $winChance,
                'custom_reset' => $resetCustom,
                'message' => $resetCustom
                    ? 'Global win chance updated and all custom rates reset'
                    : 'Global win chance updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error("Update global win chance error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Set custom win chance untuk user tertentu
     */
    public function updateCustomWinChance(Request $request, $id)
    {
        try {
            $request->validate([
                'custom_win_chance' => 'nullable|integer|min:0|max:100'
            ]);

            $user = User::findOrFail($id);

            $oldValue = $user->custom_win_chance;
            $newValue = $request->custom_win_chance;

            $user->custom_win_chance = $newValue;
            $user->save();

            // Broadcast ke user tersebut
            broadcast(new CustomWinChanceUpdated(
                $user->id,
                $user->username,
                $user->custom_win_chance
            ));

            Log::info("Custom win chance for user {$user->username} updated from {$oldValue} to {$newValue}");

            return response()->json([
                'success' => true,
                'message' => 'Custom win chance updated',
                'custom_win_chance' => $user->custom_win_chance,
                'username' => $user->username
            ]);

        } catch (\Exception $e) {
            Log::error("Update custom win chance error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove custom win chance (user akan pakai global)
     */
    public function removeCustomWinChance($id)
    {
        try {
            $user = User::findOrFail($id);

            $user->custom_win_chance = null;
            $user->save();

            // Broadcast ke user tersebut
            broadcast(new CustomWinChanceUpdated(
                $user->id,
                $user->username,
                null
            ));

            Log::info("Custom win chance removed for user {$user->username}, now using global");

            return response()->json([
                'success' => true,
                'message' => 'Custom win chance removed, user now uses global win chance',
                'username' => $user->username
            ]);

        } catch (\Exception $e) {
            Log::error("Remove custom win chance error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset user (credits, stats, dan custom win chance)
     */
    public function resetUser($id)
    {
        try {
            $user = User::findOrFail($id);

            // Reset semua stats
            $user->credits = 1000;
            $user->total_bets = 0;
            $user->total_wins = 0;
            $user->total_losses = 0;
            $user->custom_win_chance = null; // 🔥 Reset custom win chance juga
            $user->save();

            // Broadcast UserReset event
            broadcast(new UserReset($user->username, [
                'credits' => $user->credits,
                'total_bets' => $user->total_bets,
                'total_wins' => $user->total_wins,
                'total_losses' => $user->total_losses,
                'custom_win_chance' => null,
            ]));

            Log::info("User {$user->username} reset successfully");

            return response()->json([
                'success' => true,
                'message' => 'User reset successfully',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'credits' => $user->credits,
                    'total_bets' => $user->total_bets,
                    'total_wins' => $user->total_wins,
                    'total_losses' => $user->total_losses,
                    'custom_win_chance' => $user->custom_win_chance,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Reset user error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete user
     */
    public function deleteUser($id)
    {
        try {
            $user = User::findOrFail($id);

            $username = $user->username;
            $user->delete();

            Log::info("User '{$username}' deleted successfully");

            return response()->json([
                'success' => true,
                'message' => "User '{$username}' deleted successfully"
            ]);
        } catch (\Exception $e) {
            Log::error("Delete user error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Promote user to admin
     */
    public function promoteToAdmin($id)
    {
        try {
            $user = User::findOrFail($id);

            if ($user->is_admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already an admin'
                ], 400);
            }

            $user->is_admin = true;
            $user->save();

            Log::info("User {$user->username} promoted to admin");

            return response()->json([
                'success' => true,
                'message' => "User '{$user->username}' promoted to admin successfully",
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'is_admin' => $user->is_admin,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Promote to admin error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Demote admin to regular user
     */
    public function demoteFromAdmin($id)
    {
        try {
            $user = User::findOrFail($id);

            if (!$user->is_admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not an admin'
                ], 400);
            }

            $user->is_admin = false;
            $user->save();

            Log::info("Admin {$user->username} demoted to regular user");

            return response()->json([
                'success' => true,
                'message' => "Admin '{$user->username}' demoted to user successfully",
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'is_admin' => $user->is_admin,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Demote from admin error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change admin password
     */
    public function changePassword(Request $request)
    {
        try {
            $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6',
                'new_password_confirmation' => 'required|string|same:new_password'
            ]);

            // Untuk simplicity, kita asumsikan admin default dengan username 'admin'
            // Atau bisa pakai auth jika sudah implement authentication
            $admin = User::where('username', 'admin')->where('is_admin', true)->first();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin user not found'
                ], 404);
            }

            // Verify current password
            if (!Hash::check($request->current_password, $admin->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 400);
            }

            // Update password
            $admin->password = Hash::make($request->new_password);
            $admin->save();

            Log::info("Admin password changed successfully");

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);

        } catch (\Exception $e) {
            Log::error("Change password error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard statistics
     */
    public function getDashboardStats()
    {
        try {
            $totalUsers = User::count();
            $onlineUsers = User::where('is_online', true)->count();
            $totalCredits = User::sum('credits');
            $totalBets = User::sum('total_bets');
            $totalWins = User::sum('total_wins');
            $totalLosses = User::sum('total_losses');
            $usersWithCustomRate = User::whereNotNull('custom_win_chance')->count();
            $globalWinChance = cache()->get('win_chance', 50);

            return response()->json([
                'success' => true,
                'stats' => [
                    'total_users' => $totalUsers,
                    'online_users' => $onlineUsers,
                    'total_credits' => $totalCredits,
                    'total_bets' => $totalBets,
                    'total_wins' => $totalWins,
                    'total_losses' => $totalLosses,
                    'users_with_custom_rate' => $usersWithCustomRate,
                    'global_win_chance' => $globalWinChance,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Get dashboard stats error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}