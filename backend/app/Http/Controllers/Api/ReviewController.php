<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    // 作品のレビュー一覧（認証不要）
    public function index(Request $request, string $ulid): JsonResponse
    {
        $product = Product::where('ulid', $ulid)->firstOrFail();

        $reviews = Review::where('product_id', $product->id)
            ->with('user:id,ulid,name,avatar_path')
            ->orderByDesc('created_at')
            ->paginate(20);

        // 平均評価
        $avgRating = Review::where('product_id', $product->id)->avg('rating');

        return response()->json([
            'reviews'    => $reviews,
            'avg_rating' => $avgRating ? round($avgRating, 1) : null,
            'count'      => $reviews->total(),
        ]);
    }

    // レビュー投稿（購入者のみ）
    public function store(Request $request, string $ulid): JsonResponse
    {
        $product = Product::where('ulid', $ulid)->firstOrFail();

        // 購入済み確認
        $hasPurchased = Order::where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->where('status', 'completed')
            ->exists();

        if (! $hasPurchased) {
            return response()->json(['message' => '購入済みの作品にのみレビューできます。'], 403);
        }

        // 重複確認
        $alreadyReviewed = Review::where('product_id', $product->id)
            ->where('user_id', $request->user()->id)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json(['message' => 'すでにレビュー済みです。'], 422);
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body'   => ['nullable', 'string', 'max:1000'],
        ]);

        $review = Review::create([
            'product_id' => $product->id,
            'user_id'    => $request->user()->id,
            'rating'     => $validated['rating'],
            'body'       => $validated['body'] ?? null,
        ]);

        $review->load('user:id,ulid,name,avatar_path');

        return response()->json($review, 201);
    }
}