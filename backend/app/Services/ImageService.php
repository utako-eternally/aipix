<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class ImageService
{
    private string $watermarkText = 'AIPIX';

    // ── 画像保存メイン処理 ────────────────────────
    public function store(UploadedFile $file, string $ulid): array
    {
        $dir = storage_path("app/public/artworks/{$ulid}");
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $originalPath  = "artworks/{$ulid}/original.webp";
        $watermarkPath = "artworks/{$ulid}/watermark.webp";

        $absOriginal  = storage_path("app/public/{$originalPath}");
        $absWatermark = storage_path("app/public/{$watermarkPath}");

        // 元画像を読み込み
        $src = $this->loadImage($file);

        // メタ情報取得（元画像のサイズ）
        $width    = imagesx($src);
        $height   = imagesy($src);
        $fileSize = $file->getSize();

        // 原寸画像を保存（WebP）
        imagewebp($src, $absOriginal, 90);

        // ウォーターマーク合成して保存
        $wm = $this->applyWatermark($src);
        imagewebp($wm, $absWatermark, 85);

        imagedestroy($src);
        imagedestroy($wm);

        return [
            'original_path'  => $originalPath,
            'watermark_path' => $watermarkPath,
            'width'          => $width,
            'height'         => $height,
            'file_size'      => $fileSize,
        ];
    }

    // ── 画像読み込み ──────────────────────────────
    private function loadImage(UploadedFile $file): \GdImage
    {
        $mime = $file->getMimeType();
        $path = $file->getRealPath();

        $src = match ($mime) {
            'image/jpeg' => imagecreatefromjpeg($path),
            'image/png'  => imagecreatefrompng($path),
            'image/webp' => imagecreatefromwebp($path),
            default      => throw new \InvalidArgumentException("対応していない画像形式です: {$mime}"),
        };

        // PNG の透明度を白背景に合成
        if ($mime === 'image/png') {
            $w = imagesx($src);
            $h = imagesy($src);
            $bg = imagecreatetruecolor($w, $h);
            $white = imagecolorallocate($bg, 255, 255, 255);
            imagefill($bg, 0, 0, $white);
            imagecopy($bg, $src, 0, 0, 0, 0, $w, $h);
            imagedestroy($src);
            $src = $bg;
        }

        return $src;
    }

    // ── ウォーターマーク合成 ──────────────────────
    private function applyWatermark(\GdImage $src): \GdImage
    {
        $w = imagesx($src);
        $h = imagesy($src);

        $dst = imagecreatetruecolor($w, $h);
        imagecopy($dst, $src, 0, 0, 0, 0, $w, $h);

        $color = imagecolorallocatealpha($dst, 255, 255, 255, 60);

        $fontPath = 'C:/Windows/Fonts/arial.ttf';
        $fontSize = (int) max(20, min($w, $h) * 0.06);
        $angle    = -30;

        $bbox = imagettfbbox($fontSize, $angle, $fontPath, $this->watermarkText);
        $textW = abs($bbox[4] - $bbox[0]);
        $textH = abs($bbox[5] - $bbox[1]);

        $stepX = (int) ($textW * 3.0);
        $stepY = (int) ($textH * 4.0);

        for ($row = -2; $row * $stepY < $h + $stepY * 2; $row++) {
            for ($col = -1; $col * $stepX < $w + $stepX * 2; $col++) {
                $x = $col * $stepX + ($row % 2 === 0 ? 0 : (int)($stepX / 2));
                $y = $row * $stepY + $textH;
                imagettftext($dst, $fontSize, $angle, $x, $y, $color, $fontPath, $this->watermarkText);
            }
        }

        return $dst;
    }
}