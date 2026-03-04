<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    // 一覧（ウォーターマーク付き・認証不要）
    public function index(Request $request): JsonResponse
    {
        $query = Product::where('status', 'approved')
            ->select([
                'id', 'ulid', 'user_id', 'title', 'content_type',
                'age_rating', 'tags', 'watermark_path', 'price',
                'view_count', 'like_count', 'purchase_count', 'created_at',
            ]);

        // フィルター
        if ($request->filled('age_rating')) {
            $query->where('age_rating', $request->age_rating);
        }
        if ($request->filled('content_type')) {
            $query->where('content_type', $request->content_type);
        }
        if ($request->filled('tag')) {
            $query->whereJsonContains('tags', $request->tag);
        }

        // ソート
        $sortable = ['created_at', 'purchase_count', 'view_count', 'like_count'];
        $sort = in_array($request->sort, $sortable) ? $request->sort : 'created_at';
        $query->orderByDesc($sort);

        $products = $query->with('user:id,ulid,name,avatar_path')
            ->paginate(24);

        return response()->json($products);
    }

    // 詳細（プロンプトは購入済みの場合のみ返却）
    public function show(Request $request, string $ulid): JsonResponse
    {
        $product = Product::where('ulid', $ulid)
            ->where('status', 'approved')
            ->with('user:id,ulid,name,avatar_path')
            ->firstOrFail();

        $product->incrementQuietly('view_count');

        $hasPurchased = false;
        if ($request->user('sanctum')) {
            $hasPurchased = (bool) Order::where('user_id', $request->user('sanctum')->id)
                ->where('product_id', $product->id)
                ->where('status', 'completed')
                ->exists();
        }

        $data = $product->only([
            'id', 'ulid', 'user_id', 'title', 'content_type',
            'age_rating', 'tags', 'watermark_path', 'price',
            'tool_name', 'view_count', 'like_count', 'purchase_count', 'created_at',
        ]);

        if ($hasPurchased) {
            $data['prompt']      = $product->prompt;
            $data['tool_params'] = $product->tool_params;
            $data['original_path'] = $product->original_path;
        }

        $data['has_purchased'] = $hasPurchased;
        $data['user']          = $product->user;

        return response()->json($data);
    }

    // 投稿（認証必要）
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'          => ['required', 'string', 'max:100'],
            'content_type'   => ['required', 'in:illust,photo'],
            'age_rating'     => ['required', 'in:all,r18'],
            'tags'           => ['nullable', 'array', 'max:10'],
            'tags.*'         => ['string', 'max:50'],
            'price'          => ['required', 'integer', 'min:100', 'max:99999'],
            'prompt'         => ['nullable', 'string'],
            'tool_name'      => ['nullable', 'string', 'max:100'],
            'tool_params'    => ['nullable', 'array'],
            // 画像アップロードは別途 S3 署名付きURL方式で実装予定
            'watermark_path' => ['required', 'string', 'max:500'],
            'original_path'  => ['required', 'string', 'max:500'],
        ]);

        $product = Product::create([
            'ulid'           => Str::ulid(),
            'user_id'        => $request->user()->id,
            'status'         => 'pending',
            ...$validated,
        ]);

        return response()->json($product, 201);
    }

    // マイ投稿一覧（認証必要）
    public function myIndex(Request $request): JsonResponse
    {
        $products = Product::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(24);

        return response()->json($products);
    }

    // 削除（自分の作品のみ・認証必要）
    public function destroy(Request $request, string $ulid): JsonResponse
    {
        $product = Product::where('ulid', $ulid)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $product->delete();

        return response()->json(['message' => '削除しました。']);
    }
}