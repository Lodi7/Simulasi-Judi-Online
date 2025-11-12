<?php

// database/migrations/xxxx_create_game_users_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('game_users', function (Blueprint $table) {
            $table->id();
            $table->string('username')->unique();
            $table->integer('credits')->default(1000);
            $table->integer('total_bets')->default(0);
            $table->integer('total_wins')->default(0);
            $table->integer('total_losses')->default(0);
            $table->boolean('is_online')->default(false);
            $table->timestamp('last_active')->nullable();
            $table->timestamps();
        });

        Schema::create('game_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('value');
            $table->timestamps();
        });

        // Insert default win chance
        DB::table('game_settings')->insert([
            'key' => 'win_chance',
            'value' => '50',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('game_users');
        Schema::dropIfExists('game_settings');
    }
};