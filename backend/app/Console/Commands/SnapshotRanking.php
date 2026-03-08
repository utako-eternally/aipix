<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\Ranking;
use App\Models\User;
use Illuminate\Console\Command;

class SnapshotRanking extends Command
{
    protected $signature = 'ranking:snapshot
                            {period : daily, weekly, or monthly}';

    protected $description = 'Take a ranking snapshot for the given period';

    private array $ageRatings = ['all', 'r18'];

    public function handle(): int
    {
        $period = $this->argument('period');

        if (! in_array($period, ['daily', 'weekly', 'monthly'])) {
            $this->error('period は daily / weekly / monthly のいずれかを指定してください。');
            return self::FAILURE;
        }

        $snapshotted_at = now();

        // 作品ランキング
        foreach ($this->ageRatings as $ageRating) {
            $this->snapshotProducts($period, $ageRating, $snapshotted_at);
        }

        // ユーザーランキング（age_rating は all 固定）
        $this->snapshotUsers($period, $snapshotted_at);

        $this->info("ranking:snapshot [{$period}] 完了: {$snapshotted_at}");
        return self::SUCCESS;
    }

    // ── 作品ランキング ────────────────────────────────
    private function snapshotProducts(string $period, string $ageRating, \Carbon\Carbon $snapshotted_at): void
    {
        $query = Product::where('products.status', 'approved')
            ->leftJoin('orders', function ($join) {
                $join->on('orders.product_id', '=', 'products.id')
                    ->where('orders.status', 'completed')
                    ->where('orders.is_admin_purchase', false);
            })
            ->groupBy('products.id')
            ->selectRaw('
                products.id,
                (COUNT(orders.id) * 3 + MAX(products.like_count) * 2 + MAX(products.view_count)) as score
            ')
            ->orderByDesc('score')
            ->limit(50);

        if ($ageRating === 'r18') {
            $query->where('products.age_rating', 'r18');
        } else {
            $query->where('products.age_rating', 'all');
        }

        $products = $query->get();

        $records = $products->map(function ($product, $index) use ($period, $ageRating, $snapshotted_at) {
            return [
                'type'           => 'product',
                'period'         => $period,
                'age_rating'     => $ageRating,
                'rank'           => $index + 1,
                'product_id'     => $product->id,
                'user_id'        => null,
                'score'          => $product->score,
                'snapshotted_at' => $snapshotted_at,
            ];
        })->toArray();

        if (! empty($records)) {
            Ranking::insert($records);
        }

        $this->line("  [product][{$period}][{$ageRating}] {$products->count()} 件");
    }

    // ── ユーザーランキング ────────────────────────────
    private function snapshotUsers(string $period, \Carbon\Carbon $snapshotted_at): void
    {
        $users = User::where('users.is_banned', false)
            ->whereHas('products', function ($q) {
                $q->where('status', 'approved');
            })
            ->leftJoin('products', function ($join) {
                $join->on('products.user_id', '=', 'users.id')
                    ->where('products.status', 'approved');
            })
            ->leftJoin('orders', function ($join) {
                $join->on('orders.product_id', '=', 'products.id')
                    ->where('orders.status', 'completed')
                    ->where('orders.is_admin_purchase', false);
            })
            ->groupBy('users.id')
            ->selectRaw('
                users.id,
                (COUNT(orders.id) * 3 + COALESCE(SUM(products.like_count), 0) * 2 + COALESCE(SUM(products.view_count), 0)) as score
            ')
            ->orderByDesc('score')
            ->limit(50)
            ->get();

        $records = $users->map(function ($user, $index) use ($period, $snapshotted_at) {
            return [
                'type'           => 'user',
                'period'         => $period,
                'age_rating'     => 'all',
                'rank'           => $index + 1,
                'product_id'     => null,
                'user_id'        => $user->id,
                'score'          => $user->score ?? 0,
                'snapshotted_at' => $snapshotted_at,
            ];
        })->toArray();

        if (! empty($records)) {
            Ranking::insert($records);
        }

        // daily の場合は users.rank を更新
        if ($period === 'daily') {
            foreach ($users as $index => $user) {
                User::where('id', $user->id)->update(['rank' => $index + 1]);
            }
            $this->line("  [user][{$period}] users.rank 更新完了");
        }

        $this->line("  [user][{$period}] {$users->count()} 件");
    }
}