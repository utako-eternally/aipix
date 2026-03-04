<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 100);
            $table->enum('content_type', ['illust', 'photo']);
            $table->enum('age_rating', ['all', 'r18'])->default('all');
            $table->json('tags')->nullable();
            $table->string('watermark_path', 500);
            $table->string('original_path', 500);
            $table->unsignedInteger('price');
            $table->text('prompt')->nullable();
            $table->string('tool_name', 100)->nullable();
            $table->json('tool_params')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'hidden'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('reject_reason', 500)->nullable();
            $table->unsignedInteger('view_count')->default(0);
            $table->unsignedInteger('like_count')->default(0);
            $table->unsignedInteger('purchase_count')->default(0);
            $table->timestamps();

            // インデックス
            $table->index(['user_id', 'status']);
            $table->index(['status', 'age_rating', 'content_type']);
            $table->index(['status', 'purchase_count']);
            $table->index(['status', 'view_count']);
            $table->index(['status', 'like_count']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};