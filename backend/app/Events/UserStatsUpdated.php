<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserStatsUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $stats;

    // Constructor menerima 2 parameter
    public function __construct($userId, $stats)
    {
        $this->userId = $userId;
        $this->stats = $stats;
    }

    public function broadcastOn()
    {
        return new Channel('admin.users');
    }

    public function broadcastAs()
    {
        return 'UserStatsUpdated';
    }

    // Data yang di-broadcast
    public function broadcastWith()
    {
        return [
            'userId' => $this->userId,
            'stats' => $this->stats
        ];
    }
}