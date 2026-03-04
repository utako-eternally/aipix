<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\Ranking;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SnapshotRanking extends Command
{
    protected $signature = 'ranking:snapshot
                            {period : daily, weekly, or monthly}';

    protected $description = 'Take a ranking snapshot for the given period';

    // 集計対象の軸と年齢レーティングの組み合わせ
    private array $axes = ['sales', 'views', 'likes'];
    private array $ageRatings = ['all', 'r18'];

    public function handle(): int
    {
        $period = $this->argument('period');

        if (! in_array($period, ['daily', 'weekly', 'monthly'])) {
            $this->error('period は daily / weekly / monthly のいずれかを指定してください。');
            return self::FAILURE;
        }

        $snapshotted_at = now();

        foreach ($this->ageRatings as $ageRating) {
            foreach ($this->axes as $axis) {
                $this->snapshot($period, $axis, $ageRating, $snapshotted_at);
            }
        }

        $this->info("ranking:snapshot [{$period}] 完了: {$snapshotted_at}");
        return self::SUCCESS;
    }

    private function snapshot(string $period, string $axis, string $ageRating, \Carbon\Carbon $snapshotted_at): void
    {
        // 集計カラムの決定
        $scoreColumn = match ($axis) {
            'sales'  => 'purchase_count',
            'views'  => 'view_count',
            'likes'  => 'like_count',
        };

        // 年齢レーティングの絞り込み
        $query = Product::where('status', 'approved')
            ->orderByDesc($scoreColumn)
            ->limit(50);

        if ($ageRating === 'r18') {
            $query->where('age_rating', 'r18');
        }
        // 'all' の場合は全年齢（all + r18）を対象にする

        $products = $query->get(['id', $scoreColumn]);

        // 一括INSERT
        $records = $products->map(function ($product, $index) use ($period, $axis, $ageRating, $scoreColumn, $snapshotted_at) {
            return [
                'period'         => $period,
                'axis'           => $axis,
                'age_rating'     => $ageRating,
                'rank'           => $index + 1,
                'product_id'     => $product->id,
                'score'          => $product->{$scoreColumn},
                'snapshotted_at' => $snapshotted_at,
            ];
        })->toArray();

        if (! empty($records)) {
            Ranking::insert($records);
        }

        $this->line("  [{$period}][{$axis}][{$ageRating}] {$products->count()} 件");
    }
}