<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_online')->default(false);
            $table->timestamp('last_active')->nullable();
            $table->integer('total_bets')->default(0);
            $table->integer('total_wins')->default(0);
            $table->integer('total_losses')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'is_online',
                'last_active',
                'total_bets',
                'total_wins',
                'total_losses'
            ]);
        });
    }
};