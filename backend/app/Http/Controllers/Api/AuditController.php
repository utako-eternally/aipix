<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Audit;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuditController extends Controller
{
    // 審査待ち一覧（管理者）
    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status', 'pending');

        $products = Product::where('status', $status)
            ->with('user:id,ulid,name')
            ->orderBy('created_at')
            ->paginate(20);

        return response()->json($products);
    }

    // 承認
    public function approve(Request $request, string $ulid): JsonResponse
    {
        return $this->updateStatus($request, $ulid, 'approved');
    }

    // 却下
    public function reject(Request $request, string $ulid): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        return $this->updateStatus($request, $ulid, 'rejected', $request->reason);
    }

    // 非表示
    public function hide(Request $request, string $ulid): JsonResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        return $this->updateStatus($request, $ulid, 'hidden', $request->reason);
    }

    // 復元
    public function restore(Request $request, string $ulid): JsonResponse
    {
        return $this->updateStatus($request, $ulid, 'approved');
    }

    // ── private ──────────────────────────────────
    private function updateStatus(
        Request $request,
        string $ulid,
        string $status,
        ?string $reason = null
    ): JsonResponse {
        $product = Product::where('ulid', $ulid)->firstOrFail();

        $product->update([
            'status'        => $status,
            'reviewed_by'   => $request->user()->id,
            'reviewed_at'   => now(),
            'reject_reason' => $reason,
        ]);

        Audit::create([
            'product_id' => $product->id,
            'admin_id'   => $request->user()->id,
            'action'     => $status === 'approved' ? 'approved' : $status,
            'reason'     => $reason,
        ]);

        return response()->json(['message' => "ステータスを {$status} に変更しました。"]);
    }
}