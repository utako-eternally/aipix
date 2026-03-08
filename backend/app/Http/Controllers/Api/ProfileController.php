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

        $dir = storage_path('app/public/avatars');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $file     = $request->file('avatar');
        $filename = $user->ulid . '.webp';
        $absPath  = $dir . '/' . $filename;

        $src = $this->loadGdImage($file->getRealPath(), $file->getMimeType());

        // 正方形にクロップ
        $w    = imagesx($src);
        $h    = imagesy($src);
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

        return response()->json(['avatar_path' => $avatarPath]);
    }

    // カバー画像アップロード
    public function updateCover(Request $request): JsonResponse
    {
        $request->validate([
            'cover' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'], // 5MB
        ]);

        $user = $request->user();

        // 既存カバーを削除
        if ($user->cover_path) {
            $abs = storage_path('app/public/' . $user->cover_path);
            if (file_exists($abs)) {
                unlink($abs);
            }
        }

        $dir = storage_path('app/public/covers');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $file     = $request->file('cover');
        $filename = $user->ulid . '.webp';
        $absPath  = $dir . '/' . $filename;

        // フロント側でトリミング済みの画像を受け取り 1200x400 にリサイズ
        $src = $this->loadGdImage($file->getRealPath(), $file->getMimeType());

        $w = imagesx($src);
        $h = imagesy($src);

        $resized = imagecreatetruecolor(1200, 400);
        imagecopyresampled($resized, $src, 0, 0, 0, 0, 1200, 400, $w, $h);
        imagedestroy($src);

        imagewebp($resized, $absPath, 85);
        imagedestroy($resized);

        $coverPath = 'covers/' . $filename;
        $user->update(['cover_path' => $coverPath]);

        return response()->json(['cover_path' => $coverPath]);
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

    // ── GD 画像読み込み ───────────────────────────
    private function loadGdImage(string $path, string $mime): \GdImage
    {
        $src = match ($mime) {
            'image/jpeg' => imagecreatefromjpeg($path),
            'image/png'  => imagecreatefrompng($path),
            'image/webp' => imagecreatefromwebp($path),
            default      => throw new \InvalidArgumentException('対応していない画像形式です。'),
        };

        // PNG の透明度を白背景に合成
        if ($mime === 'image/png') {
            $w     = imagesx($src);
            $h     = imagesy($src);
            $bg    = imagecreatetruecolor($w, $h);
            $white = imagecolorallocate($bg, 255, 255, 255);
            imagefill($bg, 0, 0, $white);
            imagecopy($bg, $src, 0, 0, 0, 0, $w, $h);
            imagedestroy($src);
            $src = $bg;
        }

        return $src;
    }
}