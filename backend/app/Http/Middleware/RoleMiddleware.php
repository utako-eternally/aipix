<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (! $request->user()) {
            return response()->json(['message' => '認証が必要です。'], 401);
        }

        if ($request->user()->role !== $role) {
            return response()->json(['message' => '権限がありません。'], 403);
        }

        return $next($request);
    }
}