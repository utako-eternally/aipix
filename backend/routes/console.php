<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ランキングスナップショット
Schedule::command('ranking:snapshot daily')  ->dailyAt('00:05');
Schedule::command('ranking:snapshot weekly') ->weeklyOn(1, '00:10');  // 月曜00:10
Schedule::command('ranking:snapshot monthly')->monthlyOn(1, '00:15'); // 毎月1日00:15