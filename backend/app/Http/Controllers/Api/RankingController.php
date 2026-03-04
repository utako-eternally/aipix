<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ranking;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RankingController extends Controller
{
    // ランキング取得
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'period'     => ['required', 'in:daily,weekly,monthly'],
            'axis'       => ['required', 'in:sales,views,likes'],
            'age_rating' => ['nullable', 'in:all,r18'],
        ]);

        $ageRating = $request->input('age_rating', 'all');

        // 最新スナップショットの日時を取得
        $latest = Ranking::where('period', $request->period)
            ->where('axis', $request->axis)
            ->where('age_rating', $ageRating)
            ->max('snapshotted_at');

        if (! $latest) {
            return response()->json(['data' => []]);
        }

        $rankings = Ranking::where('period', $request->period)
            ->where('axis', $request->axis)
            ->where('age_rating', $ageRating)
            ->where('snapshotted_at', $latest)
            ->orderBy('rank')
            ->with('product:id,ulid,title,watermark_path,price,user_id,content_type,age_rating')
            ->get();

        return response()->json([
            'data'          => $rankings,
            'snapshotted_at' => $latest,
        ]);
    }
}