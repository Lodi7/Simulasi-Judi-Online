<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('game.spin', function () {
    return true;
});