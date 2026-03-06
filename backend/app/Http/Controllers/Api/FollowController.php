<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FollowController extends Controller
{
    // フォロー
    public function store(Request $request, string $ulid): JsonResponse
    {
        $target = User::where('ulid', $ulid)->firstOrFail();

        if ($target->id === $request->user()->id) {
            return response()->json(['message' => '自分自身をフォローできません。'], 422);
        }

        $already = Follow::where('follower_id', $request->user()->id)
            ->where('following_id', $target->id)
            ->exists();

        if ($already) {
            return response()->json(['message' => 'すでにフォロー済みです。'], 422);
        }

        Follow::create([
            'follower_id'  => $request->user()->id,
            'following_id' => $target->id,
        ]);

        return response()->json([
            'following'        => true,
            'followers_count'  => $target->followers()->count(),
        ]);
    }

    // アンフォロー
    public function destroy(Request $request, string $ulid): JsonResponse
    {
        $target = User::where('ulid', $ulid)->firstOrFail();

        Follow::where('follower_id', $request->user()->id)
            ->where('following_id', $target->id)
            ->delete();

        return response()->json([
            'following'        => false,
            'followers_count'  => $target->followers()->count(),
        ]);
    }
}