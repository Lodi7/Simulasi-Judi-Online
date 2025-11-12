<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserReset implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $username;
    public $data;

    /**
     * Create a new event instance.
     *
     * @param string $username
     * @param array $data (credits, total_bets, total_wins, total_losses, custom_win_chance)
     */
    public function __construct($username, array $data)
    {
        $this->username = $username;
        $this->data = $data;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('user.' . $this->username),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'UserReset';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'username' => $this->username,
            'credits' => $this->data['credits'] ?? 1000,
            'total_bets' => $this->data['total_bets'] ?? 0,
            'total_wins' => $this->data['total_wins'] ?? 0,
            'total_losses' => $this->data['total_losses'] ?? 0,
            'custom_win_chance' => $this->data['custom_win_chance'] ?? null,
        ];
    }
}