<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserCreditsUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $username;
    public $credits;

    public function __construct($username, $credits)
    {
        $this->username = $username;
        $this->credits = $credits;
    }

    public function broadcastOn()
    {
        return new Channel('user.' . $this->username);
    }

    public function broadcastAs()
    {
        return 'CreditsUpdated';
    }

    public function broadcastWith()
    {
        return [
            'username' => $this->username,
            'credits' => $this->credits
        ];
    }
}