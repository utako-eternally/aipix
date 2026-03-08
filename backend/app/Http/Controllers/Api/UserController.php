<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Follow;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    // ユーザー詳細
    public function show(Request $request, string $ulid): JsonResponse
    {
        $user = User::where('ulid', $ulid)
            ->where('is_banned', false)
            ->firstOrFail();

        $isFollowing = false;
        if ($request->user('sanctum')) {
            $isFollowing = (bool) Follow::where('follower_id', $request->user('sanctum')->id)
                ->where('following_id', $user->id)
                ->exists();
        }

        return response()->json([
            'id'               => $user->id,
            'ulid'             => $user->ulid,
            'name'             => $user->name,
            'bio'              => $user->bio,
            'avatar_path'      => $user->avatar_path,
            'cover_path'       => $user->cover_path,
            'followers_count'  => $user->followers()->count(),
            'following_count'  => $user->following()->count(),
            'products_count'   => Product::where('user_id', $user->id)->where('status', 'approved')->count(),
            'is_following'     => $isFollowing,
            'created_at'       => $user->created_at,
        ]);
    }

    // ユーザーの投稿作品一覧
    public function products(Request $request, string $ulid): JsonResponse
    {
        $user = User::where('ulid', $ulid)
            ->where('is_banned', false)
            ->firstOrFail();

        $products = Product::where('user_id', $user->id)
            ->where('status', 'approved')
            ->select([
                'id', 'ulid', 'user_id', 'title', 'content_type',
                'age_rating', 'tags', 'watermark_path', 'price',
                'view_count', 'like_count', 'purchase_count', 'tool_name', 'created_at',
            ])
            ->with('user:id,ulid,name,avatar_path')
            ->orderByDesc('created_at')
            ->paginate(24);

        return response()->json($products);
    }

    // フォロー中一覧
    public function following(Request $request, string $ulid): JsonResponse
    {
        $user = User::where('ulid', $ulid)->where('is_banned', false)->firstOrFail();

        $users = $user->following()
            ->select('users.id', 'users.ulid', 'users.name', 'users.avatar_path', 'users.bio')
            ->paginate(24);

        return response()->json($users);
    }

    // フォロワー一覧
    public function followers(Request $request, string $ulid): JsonResponse
    {
        $user = User::where('ulid', $ulid)->where('is_banned', false)->firstOrFail();

        $users = $user->followers()
            ->select('users.id', 'users.ulid', 'users.name', 'users.avatar_path', 'users.bio')
            ->paginate(24);

        return response()->json($users);
    }
}