<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    // 購入（Amazon Pay 決済セッション作成）
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_ulid' => ['required', 'string'],
        ]);

        $product = Product::where('ulid', $validated['product_ulid'])
            ->where('status', 'approved')
            ->firstOrFail();

        // 二重購入チェック
        $alreadyPurchased = Order::where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->where('status', 'completed')
            ->exists();

        if ($alreadyPurchased) {
            return response()->json(['message' => 'すでに購入済みです。'], 422);
        }

        $isAdmin = $request->user()->role === 'admin';

        $platformFee    = $isAdmin ? 0 : (int) round($product->price * 0.3);
        $creatorRevenue = $isAdmin ? 0 : $product->price - $platformFee;

        $order = Order::create([
            'ulid'                      => Str::ulid(),
            'user_id'                   => $request->user()->id,
            'product_id'                => $product->id,
            'amount'                    => $isAdmin ? 0 : $product->price,
            'platform_fee'              => $platformFee,
            'creator_revenue'           => $creatorRevenue,
            'amazon_order_reference_id' => 'amzn_dummy_' . Str::random(20),
            'status'                    => $isAdmin ? 'completed' : 'pending',
            'is_admin_purchase'         => $isAdmin,
            'purchased_at'              => $isAdmin ? now() : null,
        ]);

        // 管理者の場合はそのまま完了処理（purchase_countは集計から除外するためincrementしない）
        return response()->json(['order' => $order], 201);
    }

    // Amazon Pay IPN（即時支払い通知）
    public function webhook(Request $request): JsonResponse
    {
        // TODO: Amazon Pay IPN署名検証・イベント処理を実装
        // OrderReferenceNotification → order.status = completed
        // + product.purchase_count++

        return response()->json(['message' => 'ok']);
    }

    // 購入履歴（認証必要）
    public function myIndex(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->where('status', 'completed')
            ->with('product:id,ulid,title,watermark_path,price')
            ->orderByDesc('purchased_at')
            ->paginate(24);

        return response()->json($orders);
    }

    // 原寸画像の署名付きURL取得（認証必要・購入済み確認）
    public function download(Request $request, string $ulid): JsonResponse
    {
        $order = Order::where('ulid', $ulid)
            ->where('user_id', $request->user()->id)
            ->where('status', 'completed')
            ->with('product')
            ->firstOrFail();

        // TODO: S3署名付きURL生成（有効期限15分）
        // $url = Storage::temporaryUrl($order->product->original_path, now()->addMinutes(15));

        return response()->json([
            'download_url' => 'https://example.com/dummy', // TODO: S3実装後に置き換え
            'expires_at'   => now()->addMinutes(15)->toIso8601String(),
        ]);
    }

    public function devComplete(Request $request, string $ulid): JsonResponse
    {
        abort_unless(app()->environment('local'), 404);

        $order = Order::where('ulid', $ulid)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $order->update([
            'status'       => 'completed',
            'purchased_at' => now(),
        ]);

        $order->product->increment('purchase_count');

        return response()->json(['message' => '注文を完了しました。', 'order' => $order]);
    }

}