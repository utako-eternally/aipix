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
        if ($axis === 'sales') {
            // 管理者購入を除外した実購入数で集計
            $query = Product::where('products.status', 'approved')
                ->leftJoin('orders', function ($join) {
                    $join->on('orders.product_id', '=', 'products.id')
                        ->where('orders.status', 'completed')
                        ->where('orders.is_admin_purchase', false);
                })
                ->groupBy('products.id')
                ->selectRaw('products.id, COUNT(orders.id) as score')
                ->orderByDesc('score')
                ->limit(50);

            if ($ageRating === 'r18') {
                $query->where('products.age_rating', 'r18');
            }

            $products = $query->get();
        } else {
            $scoreColumn = match ($axis) {
                'views' => 'view_count',
                'likes' => 'like_count',
            };

            $query = Product::where('status', 'approved')
                ->orderByDesc($scoreColumn)
                ->limit(50);

            if ($ageRating === 'r18') {
                $query->where('age_rating', 'r18');
            }

            $products = $query->get(['id', $scoreColumn]);
            $products = $products->map(function ($p) use ($scoreColumn) {
                $p->score = $p->{$scoreColumn};
                return $p;
            });
        }

        $records = $products->map(function ($product, $index) use ($period, $axis, $ageRating, $snapshotted_at) {
            return [
                'period'         => $period,
                'axis'           => $axis,
                'age_rating'     => $ageRating,
                'rank'           => $index + 1,
                'product_id'     => $product->id,
                'score'          => $product->score,
                'snapshotted_at' => $snapshotted_at,
            ];
        })->toArray();

        if (! empty($records)) {
            Ranking::insert($records);
        }

        $this->line("  [{$period}][{$axis}][{$ageRating}] {$products->count()} 件");
    }
}