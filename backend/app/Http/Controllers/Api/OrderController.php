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
    // 購入（PaymentIntent作成）
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

        // Stripe PaymentIntent 作成（TODO: Stripe SDK導入後に実装）
        // $paymentIntent = \Stripe\PaymentIntent::create([...]);

        $platformFee    = (int) round($product->price * 0.3);
        $creatorRevenue = $product->price - $platformFee;

        $order = Order::create([
            'ulid'                      => Str::ulid(),
            'user_id'                   => $request->user()->id,
            'product_id'                => $product->id,
            'amount'                    => $product->price,
            'platform_fee'              => $platformFee,
            'creator_revenue'           => $creatorRevenue,
            'stripe_payment_intent_id'  => 'pi_dummy_' . Str::random(20), // TODO: Stripe実装後に置き換え
            'status'                    => 'pending',
        ]);

        return response()->json([
            'order'         => $order,
            // 'client_secret' => $paymentIntent->client_secret, // TODO
        ], 201);
    }

    // Stripe Webhook
    public function webhook(Request $request): JsonResponse
    {
        // TODO: Stripe Webhook署名検証・イベント処理を実装
        // payment_intent.succeeded → order.status = completed
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
}