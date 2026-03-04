<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'ulid',
        'user_id',
        'title',
        'content_type',
        'age_rating',
        'tags',
        'watermark_path',
        'original_path',
        'price',
        'prompt',
        'tool_name',
        'tool_params',
        'status',
        'reviewed_by',
        'reviewed_at',
        'reject_reason',
        'view_count',
        'like_count',
        'purchase_count',
    ];

    protected function casts(): array
    {
        return [
            'tags'        => 'array',
            'tool_params' => 'array',
            'reviewed_at' => 'datetime',
            'price'       => 'integer',
            'view_count'  => 'integer',
            'like_count'  => 'integer',
            'purchase_count' => 'integer',
        ];
    }

    // ── リレーション ──────────────────────────────
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function rankings(): HasMany
    {
        return $this->hasMany(Ranking::class);
    }

    public function audits(): HasMany
    {
        return $this->hasMany(Audit::class);
    }
}