<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Carbon\Carbon;

class SetUsersOffline extends Command
{
    protected $signature = 'users:set-offline';
    protected $description = 'Set users offline jika tidak aktif lebih dari 30 detik';

    public function handle()
    {
        // User yang tidak aktif > 30 detik dianggap offline
        $threshold = Carbon::now()->subSeconds(15);

        $count = User::where('is_online', true)
            ->where('last_active', '<', $threshold)
            ->update(['is_online' => false]);

        $this->info("Set {$count} users to offline");
        return 0;
    }
}