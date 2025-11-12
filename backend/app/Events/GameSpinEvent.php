<?php
// app/Events/GameSpinEvent.php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameSpinEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $payload;

    public function __construct($username, array $result)
    {
        $this->payload = [
            'username' => $username,
            'result' => $result,
        ];
    }

    public function broadcastOn(): array
    {
        return ['game.spin'];
    }

    public function broadcastAs(): string
    {
        return 'GameSpinEvent';
    }
}
