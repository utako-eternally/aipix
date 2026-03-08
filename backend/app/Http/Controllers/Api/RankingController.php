<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ranking;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RankingController extends Controller
{
    // 作品ランキング取得
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'period'     => ['required', 'in:daily,weekly,monthly'],
            'age_rating' => ['nullable', 'in:all,r18'],
        ]);

        $ageRating = $request->input('age_rating', 'all');

        $latest = Ranking::where('type', 'product')
            ->where('period', $request->period)
            ->where('age_rating', $ageRating)
            ->max('snapshotted_at');

        if (! $latest) {
            return response()->json(['data' => []]);
        }

        $rankings = Ranking::where('type', 'product')
            ->where('period', $request->period)
            ->where('age_rating', $ageRating)
            ->where('snapshotted_at', $latest)
            ->orderBy('rank')
            ->with([
    'product:id,ulid,title,watermark_path,price,user_id,content_type,age_rating,tool_name,is_prompt_public',
    'product.user:id,ulid,name,avatar_path',
])
            ->get();

        return response()->json([
            'data'           => $rankings,
            'snapshotted_at' => $latest,
        ]);
    }

    // ユーザーランキング取得
    public function users(Request $request): JsonResponse
    {
        $request->validate([
            'period' => ['required', 'in:daily,weekly,monthly'],
        ]);

        $latest = Ranking::where('type', 'user')
            ->where('period', $request->period)
            ->where('age_rating', 'all')
            ->max('snapshotted_at');

        if (! $latest) {
            return response()->json(['data' => []]);
        }

        $rankings = Ranking::where('type', 'user')
            ->where('period', $request->period)
            ->where('age_rating', 'all')
            ->where('snapshotted_at', $latest)
            ->orderBy('rank')
            ->with('user:id,ulid,name,avatar_path,bio,rank')
            ->get();

        return response()->json([
            'data'           => $rankings,
            'snapshotted_at' => $latest,
        ]);
    }
}