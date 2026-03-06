<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    // プロフィール取得
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    // プロフィール更新（ニックネーム・自己紹介）
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'bio'  => ['nullable', 'string', 'max:500'],
        ]);

        $request->user()->update($validated);

        return response()->json($request->user()->fresh());
    }

    // アバター画像アップロード
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:2048'], // 2MB
        ]);

        $user = $request->user();

        // 既存アバターを削除
        if ($user->avatar_path) {
            $abs = storage_path('app/public/' . $user->avatar_path);
            if (file_exists($abs)) {
                unlink($abs);
            }
        }

        // 保存先ディレクトリ
        $dir = storage_path('app/public/avatars');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // WebP に変換して保存
        $file     = $request->file('avatar');
        $filename = $user->ulid . '.webp';
        $absPath  = $dir . '/' . $filename;

        $src = match ($file->getMimeType()) {
            'image/jpeg' => imagecreatefromjpeg($file->getRealPath()),
            'image/png'  => imagecreatefrompng($file->getRealPath()),
            'image/webp' => imagecreatefromwebp($file->getRealPath()),
            default      => throw new \InvalidArgumentException('対応していない画像形式です。'),
        };

        // 正方形にクロップ
        $w = imagesx($src);
        $h = imagesy($src);
        $size = min($w, $h);
        $x    = (int)(($w - $size) / 2);
        $y    = (int)(($h - $size) / 2);

        $cropped = imagecreatetruecolor($size, $size);
        imagecopy($cropped, $src, 0, 0, $x, $y, $size, $size);
        imagedestroy($src);

        // 200x200 にリサイズ
        $resized = imagecreatetruecolor(200, 200);
        imagecopyresampled($resized, $cropped, 0, 0, 0, 0, 200, 200, $size, $size);
        imagedestroy($cropped);

        imagewebp($resized, $absPath, 85);
        imagedestroy($resized);

        $avatarPath = 'avatars/' . $filename;
        $user->update(['avatar_path' => $avatarPath]);

        return response()->json([
            'avatar_path' => $avatarPath,
        ]);
    }

    // パスワード変更
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => '現在のパスワードが正しくありません。'], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['message' => 'パスワードを変更しました。']);
    }
}