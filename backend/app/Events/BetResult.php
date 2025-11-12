<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BetResult implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $betAmount;
    public $won;
    public $winAmount;

    public function __construct($userId, $betAmount, $won, $winAmount = 0)
    {
        $this->userId = $userId;
        $this->betAmount = $betAmount;
        $this->won = $won;
        $this->winAmount = $winAmount;
    }

    public function broadcastOn()
    {
        return [
            new Channel('game'),
            new Channel('admin.users'),
        ];
    }

    public function broadcastAs()
    {
        return 'BetResult';
    }

    public function broadcastWith()
    {
        return [
            'user_id' => $this->userId,
            'bet_amount' => $this->betAmount,
            'won' => $this->won,
            'win_amount' => $this->winAmount,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}