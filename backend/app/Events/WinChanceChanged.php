<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WinChanceChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Nilai global win chance yang baru.
     *
     * @var int
     */
    public $winChance;

    /**
     * Buat instance baru dari event.
     *
     * @param  int  $winChance
     * @return void
     */
    public function __construct($winChance)
    {
        $this->winChance = $winChance;
    }

    /**
     * Tentukan channel broadcast.
     *
     * @return array
     */
    public function broadcastOn(): array
    {
        // Gunakan public channel karena ini untuk semua user
        return [
            new Channel('global-win-chance'),
        ];
    }

    /**
     * Tentukan nama event di sisi frontend.
     *
     * @return string
     */
    public function broadcastAs(): string
    {
        return 'WinChanceChanged';
    }

    /**
     * Data yang dikirim ke frontend.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'win_chance' => $this->winChance,
            'updated_at' => now()->toDateTimeString(),
        ];
    }
}
