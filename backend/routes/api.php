<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\AdminController;

// Auth
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::post('/heartbeat', [AuthController::class, 'heartbeat']);
Route::post('/admin-login', [AuthController::class, 'adminLogin']);
Route::post('/admin/change-password', [AuthController::class, 'changePassword']);
// User management
Route::post('/admin/users/{id}/promote', [AuthController::class, 'promoteToAdmin']);
Route::post('/admin/users/{id}/demote', [AuthController::class, 'demoteFromAdmin']);
// Game
Route::get('/win-chance', [GameController::class, 'getWinChanceAPI']);
Route::post('/admin/win-chance', [GameController::class, 'updateWinChanceAPI']);
Route::post('/spin', [GameController::class, 'spin']);
Route::get('/user-stats', [GameController::class, 'getUserStats']);

// Tambahkan routes untuk custom win chance
Route::post('/admin/users/{id}/custom-win-chance', [AdminController::class, 'updateCustomWinChance']);
Route::delete('/admin/users/{id}/custom-win-chance', [AdminController::class, 'removeCustomWinChance']);
Route::post('/admin/global-win-chance', [AdminController::class, 'updateGlobalWinChance']);

// Admin
Route::prefix('admin')->group(function () {
    Route::get('/users', [AdminController::class, 'getUsers']);
    Route::post('/win-chance', [AdminController::class, 'updateWinChance']);
    Route::post('/users/{id}/reset', [AdminController::class, 'resetUser']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
});
