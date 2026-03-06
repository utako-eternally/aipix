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
                'view_count', 'like_count', 'purchase_count', 'is_prompt_public', 'created_at',
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

        // 無料作品は購入なしでも原寸・プロンプト公開
        $isFree = $product->price === 0;

        $data = $product->only([
            'id', 'ulid', 'user_id', 'title', 'content_type',
            'age_rating', 'tags', 'watermark_path', 'price',
            'tool_name', 'view_count', 'like_count', 'purchase_count',
            'width', 'height', 'file_size', 'created_at','is_prompt_public',
        ]);

        if ($hasPurchased || $isFree) {
            $data['prompt']        = $product->prompt;
            $data['tool_params']   = $product->tool_params;
            $data['original_path'] = $product->original_path;
        }

        $data['has_purchased'] = $hasPurchased || $isFree;
        $data['user']          = $product->user;

        return response()->json($data);
    }

    // 投稿（認証必要）
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:100'],
            'content_type' => ['required', 'in:illust,photo,video'],
            'age_rating'   => ['required', 'in:all,r18'],
            'tags'         => ['nullable', 'array', 'max:10'],
            'tags.*'       => ['string', 'max:50'],
            'price'        => ['required', 'integer', 'min:0', 'max:1000'],
            'prompt'       => ['nullable', 'string'],
            'tool_name'    => ['nullable', 'string', 'max:100'],
            'tool_params'  => ['nullable', 'array'],
            'image'        => ['required', 'image', 'mimes:jpeg,png,webp', 'max:10240'],
            'is_prompt_public' => ['boolean'],
        ]);

        $ulid = Str::ulid();

        // 画像保存・ウォーターマーク合成
        $imageService = new \App\Services\ImageService();
        $paths = $imageService->store($request->file('image'), $ulid);

        $product = Product::create([
            'ulid'           => $ulid,
            'user_id'        => $request->user()->id,
            'status'         => 'pending',
            'title'          => $validated['title'],
            'content_type'   => $validated['content_type'],
            'age_rating'     => $validated['age_rating'],
            'tags'           => $validated['tags'] ?? null,
            'price'          => $validated['price'],
            'prompt'         => $validated['prompt'] ?? null,
            'tool_name'      => $validated['tool_name'] ?? null,
            'tool_params'    => $validated['tool_params'] ?? null,
            'watermark_path' => $paths['watermark_path'],
            'original_path'  => $paths['original_path'],
            'width'          => $paths['width'],
            'height'         => $paths['height'],
            'file_size'      => $paths['file_size'],
            'is_prompt_public' => $validated['is_prompt_public'] ?? false,
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