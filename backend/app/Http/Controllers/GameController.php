<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Events\UserStatsUpdated;

class GameController extends Controller
{
    public function spin(Request $request)
    {
        try {
            $request->validate([
                'username' => 'required|string',
                'bet' => 'required|integer|min:10'
            ]);

            $user = User::where('username', $request->username)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan'
                ], 404);
            }

            if ($user->credits < $request->bet) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credits tidak cukup'
                ], 400);
            }

            // Kurangi credits
            $user->credits -= $request->bet;

            // Update total bets
            $user->total_bets += $request->bet;

            // Update last active
            $user->last_active = now();

            // 🔥 GUNAKAN WIN CHANCE PER USER (custom atau global)
            $winChance = $user->getEffectiveWinChance();

            // Simulasi win/lose berdasarkan win chance
            $isWin = rand(1, 100) <= $winChance;

            // Daftar simbol & multiplier
            $symbols = [
                ["🍏", 2],
                ["🥭", 3],
                ["🍇", 5],
                ["🍈", 4],
                ["🍒", 10]
            ];

            $result = [];
            $winAmount = 0;

            if ($isWin) {
                // Pilih 1 simbol acak dan 1 baris acak untuk dijadikan baris menang
                $chosen = $symbols[array_rand($symbols)];
                $winSymbol = $chosen[0];
                $multiplier = $chosen[1];
                $winningRow = rand(0, 2);

                for ($i = 0; $i < 3; $i++) {
                    $row = [];
                    for ($j = 0; $j < 5; $j++) {
                        if ($i === $winningRow) {
                            $row[] = $winSymbol;
                        } else {
                            $row[] = $symbols[array_rand($symbols)][0];
                        }
                    }
                    $result[] = $row;
                }

                $winAmount = $request->bet * $multiplier;
                $user->credits += $winAmount;
                $user->total_wins += 1;

            } else {
                for ($i = 0; $i < 3; $i++) {
                    $row = [];
                    for ($j = 0; $j < 5; $j++) {
                        $row[] = $symbols[array_rand($symbols)][0];
                    }
                    $result[] = $row;
                }

                $user->total_losses += 1;
            }

            // Simpan perubahan ke database
            $user->save();

            // Broadcast stats update
            broadcast(new UserStatsUpdated($user->id, [
                'total_bets' => $user->total_bets,
                'total_wins' => $user->total_wins,
                'total_losses' => $user->total_losses,
                'credits' => $user->credits,
            ]));

            return response()->json([
                'success' => true,
                'isWin' => $isWin,
                'winAmount' => $winAmount,
                'credits' => $user->credits,
                'result' => $result,
                'winChance' => $winChance, // 🔥 Return win chance yang digunakan
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getWinChanceAPI()
    {
        try {
            $winChance = cache()->get('win_chance', 50);

            return response()->json([
                'winChance' => $winChance
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'winChance' => 50
            ]);
        }
    }

    public function updateWinChanceAPI(Request $request)
    {
        try {
            $request->validate([
                'win_chance' => 'required|integer|min:0|max:100'
            ]);

            cache()->put('win_chance', $request->win_chance, now()->addDays(30));

            return response()->json([
                'success' => true,
                'win_chance' => $request->win_chance
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}