<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\RankingController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\ReviewController;

// ── 認証不要 ──────────────────────────────────────
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

// 作品一覧・詳細（ウォーターマーク付き）
Route::get('/products',        [ProductController::class, 'index']);
Route::get('/products/{ulid}', [ProductController::class, 'show']);

// ランキング
Route::get('/rankings', [RankingController::class, 'index']);
Route::get('/rankings/users', [RankingController::class, 'users']);

// ユーザーページ
Route::get('/users/{ulid}',          [UserController::class, 'show']);
Route::get('/users/{ulid}/products', [UserController::class, 'products']);

// レビュー
Route::get('/products/{ulid}/reviews', [ReviewController::class, 'index']);

// フォロー関係
Route::get('/users/{ulid}/following', [UserController::class, 'following']);
Route::get('/users/{ulid}/followers', [UserController::class, 'followers']);

// ── 認証必要 ──────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // 認証
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // 作品投稿・マイ投稿
    Route::post('/products',              [ProductController::class, 'store']);
    Route::get('/my/products',            [ProductController::class, 'myIndex']);
    Route::delete('/products/{ulid}',     [ProductController::class, 'destroy']);

    // 購入・注文
    Route::post('/orders',                    [OrderController::class, 'store']);       // 購入（PaymentIntent作成）
    Route::post('/orders/webhook',            [OrderController::class, 'webhook']);     // Stripe Webhook
    Route::get('/my/orders',                  [OrderController::class, 'myIndex']);     // 購入履歴
    Route::get('/my/orders/{ulid}/download',  [OrderController::class, 'download']);   // 署名付きURL取得
    Route::post('/dev/orders/{ulid}/complete', [OrderController::class, 'devComplete']); // 開発用：注文完了（Stripe Webhookの代替）

    // いいね
    Route::post('/products/{ulid}/like',   [LikeController::class, 'store']);
    Route::delete('/products/{ulid}/like', [LikeController::class, 'destroy']);

    // プロフィール
    Route::get('/profile',                 [ProfileController::class, 'show']);
    Route::post('/profile',                [ProfileController::class, 'update']);
    Route::post('/profile/avatar',         [ProfileController::class, 'updateAvatar']);
    Route::post('/profile/password',       [ProfileController::class, 'updatePassword']);
    Route::post('/profile/cover', [ProfileController::class, 'updateCover']);

    // フォロー
    Route::post('/users/{ulid}/follow',   [FollowController::class, 'store']);
    Route::delete('/users/{ulid}/follow', [FollowController::class, 'destroy']);

    // レビュー
    Route::post('/products/{ulid}/reviews', [ReviewController::class, 'store']);

    // 管理者専用
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/products',                      [AuditController::class, 'index']);    // 審査待ち一覧
        Route::post('/products/{ulid}/approve',      [AuditController::class, 'approve']); // 承認
        Route::post('/products/{ulid}/reject',       [AuditController::class, 'reject']);  // 却下
        Route::post('/products/{ulid}/hide',         [AuditController::class, 'hide']);    // 非表示
        Route::post('/products/{ulid}/restore',      [AuditController::class, 'restore']); // 復元
    });
});