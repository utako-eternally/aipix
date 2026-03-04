<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rankings', function (Blueprint $table) {
            $table->id();
            $table->enum('period', ['daily', 'weekly', 'monthly']);
            $table->enum('axis', ['sales', 'views', 'likes']);
            $table->enum('age_rating', ['all', 'r18']);
            $table->unsignedSmallInteger('rank');
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('score')->default(0);
            $table->timestamp('snapshotted_at');

            $table->unique(['period', 'axis', 'age_rating', 'rank', 'snapshotted_at'], 'rankings_unique');
            $table->index(['period', 'axis', 'age_rating', 'snapshotted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rankings');
    }
};