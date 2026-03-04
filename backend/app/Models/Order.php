<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'ulid',
        'user_id',
        'product_id',
        'amount',
        'platform_fee',
        'creator_revenue',
        'stripe_payment_intent_id',
        'stripe_charge_id',
        'status',
        'purchased_at',
    ];

    protected function casts(): array
    {
        return [
            'amount'          => 'integer',
            'platform_fee'    => 'integer',
            'creator_revenue' => 'integer',
            'purchased_at'    => 'datetime',
        ];
    }

    // ── リレーション ──────────────────────────────
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}