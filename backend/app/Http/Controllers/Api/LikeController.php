<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Like;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LikeController extends Controller
{
    // いいね追加
    public function store(Request $request, string $ulid): JsonResponse
    {
        $product = Product::where('ulid', $ulid)
            ->where('status', 'approved')
            ->firstOrFail();

        $already = Like::where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->exists();

        if ($already) {
            return response()->json(['message' => 'すでにいいね済みです。'], 422);
        }

        Like::create([
            'user_id'    => $request->user()->id,
            'product_id' => $product->id,
        ]);

        $product->incrementQuietly('like_count');

        return response()->json(['like_count' => $product->like_count + 1], 201);
    }

    // いいね解除
    public function destroy(Request $request, string $ulid): JsonResponse
    {
        $product = Product::where('ulid', $ulid)->firstOrFail();

        $deleted = Like::where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->delete();

        if ($deleted) {
            $product->decrementQuietly('like_count');
        }

        return response()->json(['like_count' => max(0, $product->like_count - 1)]);
    }
}