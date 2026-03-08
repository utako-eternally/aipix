<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('rankings');

        Schema::create('rankings', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['product', 'user']);
            $table->enum('period', ['daily', 'weekly', 'monthly']);
            $table->enum('age_rating', ['all', 'r18']);
            $table->unsignedSmallInteger('rank');
            $table->foreignId('product_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('score')->default(0);
            $table->timestamp('snapshotted_at');

            $table->unique(['type', 'period', 'age_rating', 'rank', 'snapshotted_at'], 'rankings_unique');
            $table->index(['type', 'period', 'age_rating', 'snapshotted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rankings');
    }
};