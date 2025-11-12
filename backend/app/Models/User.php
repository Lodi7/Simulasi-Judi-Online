<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory; // Hapus HasApiTokens

    protected $fillable = [
        'username',
        'password',
        'credits',
        'total_bets',
        'total_wins',
        'total_losses',
        'is_online',
        'is_admin',
        'last_active',
        'custom_win_chance',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'credits' => 'integer',
        'total_bets' => 'integer',
        'total_wins' => 'integer',
        'total_losses' => 'integer',
        'is_online' => 'boolean',
        'is_admin' => 'boolean',
        'custom_win_chance' => 'integer',
    ];

    public function getEffectiveWinChance(): int
    {
        if ($this->custom_win_chance !== null) {
            return $this->custom_win_chance;
        }

        return cache()->get('win_chance', 50);
    }
}