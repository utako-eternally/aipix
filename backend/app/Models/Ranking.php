<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ranking extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'type',
        'period',
        'age_rating',
        'rank',
        'product_id',
        'user_id',
        'score',
        'snapshotted_at',
    ];

    protected $casts = [
        'snapshotted_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}