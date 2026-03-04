<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ranking extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'period',
        'axis',
        'age_rating',
        'rank',
        'product_id',
        'score',
        'snapshotted_at',
    ];

    protected function casts(): array
    {
        return [
            'rank'           => 'integer',
            'score'          => 'integer',
            'snapshotted_at' => 'datetime',
        ];
    }

    // ── リレーション ──────────────────────────────
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}