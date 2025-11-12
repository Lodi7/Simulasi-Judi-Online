<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CustomWinChanceUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $username;
    public $customWinChance;

    public function __construct($userId, $username, $customWinChance)
    {
        $this->userId = $userId;
        $this->username = $username;
        $this->customWinChance = $customWinChance;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('user.' . $this->username),
        ];
    }

    public function broadcastAs(): string
    {
        return 'CustomWinChanceUpdated';
    }
}