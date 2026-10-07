package app.gdtdrill;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.webkit.JavascriptInterface;

/**
 * Web（index.html）から呼ぶアプリ側の機能。JavaScript では window.GDTApp として見える。
 */
public class Bridge implements Runnable {
    private final Activity act;

    Bridge(Activity act) {
        this.act = act;
    }

    /** リマインダーのオン／オフと時刻を保存して予約し直す。オンにしたとき、必要なら通知の許可を求める */
    @JavascriptInterface
    public void setReminder(boolean on, int h, int m) {
        try {
            act.getSharedPreferences(Reminder.PREFS, Context.MODE_PRIVATE).edit()
                    .putBoolean("on", on).putInt("h", h).putInt("m", m).apply();
            Reminder.schedule(act);
            if (on) act.runOnUiThread(this);
        } catch (Throwable ignored) {
        }
    }

    /** 今日の解答数・目標・連続日数を保存する（通知を出すかどうかの判断に使う） */
    @JavascriptInterface
    public void setStatus(String day, int today, int goal, int streak) {
        try {
            act.getSharedPreferences(Reminder.PREFS, Context.MODE_PRIVATE).edit()
                    .putString("day", day).putInt("today", today).putInt("goal", goal).putInt("streak", streak).apply();
        } catch (Throwable ignored) {
        }
    }

    /** 通知が許可されているか（Android の設定でオフにされていれば false） */
    @JavascriptInterface
    public boolean notifAllowed() {
        try {
            NotificationManager nm = (NotificationManager) act.getSystemService(Context.NOTIFICATION_SERVICE);
            return nm.areNotificationsEnabled();
        } catch (Throwable t) {
            return false;
        }
    }

    /** 動作確認用：いますぐ通知を1件出す */
    @JavascriptInterface
    public void testNotify() {
        try {
            Reminder.notify(act, "通知のテストです。毎日この形でお知らせします。");
        } catch (Throwable ignored) {
        }
    }

    /**
     * 実力診断の結果の画像（PNG、Base64）を保存する。戻り値は画面に出すメッセージ。
     * Android 10 以降は「ピクチャ／幾何公差ドリル」に保存（権限は不要）。
     * Android 8〜9 はアプリ専用の画像フォルダに保存する（ストレージの権限を求めないため）。
     */
    @JavascriptInterface
    public String saveImage(String base64, String fileName) {
        try {
            byte[] data = android.util.Base64.decode(base64, android.util.Base64.DEFAULT);
            String name = fileName.replaceAll("[\\\\/:*?\"<>|]", "_");
            if (Build.VERSION.SDK_INT >= 29) {
                android.content.ContentValues v = new android.content.ContentValues();
                v.put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, name);
                v.put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "image/png");
                v.put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH,
                        android.os.Environment.DIRECTORY_PICTURES + "/幾何公差ドリル");
                // 書き込みが終わるまでは他のアプリから見えないようにし、失敗したら登録を消す（0 バイトの画像を残さない）
                v.put(android.provider.MediaStore.MediaColumns.IS_PENDING, 1);
                android.content.ContentResolver cr = act.getContentResolver();
                android.net.Uri uri = cr.insert(android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                if (uri == null) return "画像を保存できませんでした";
                try (java.io.OutputStream os = cr.openOutputStream(uri)) {
                    if (os == null) throw new java.io.IOException("no stream");
                    os.write(data);
                } catch (Throwable e) {
                    cr.delete(uri, null, null);
                    return "画像を保存できませんでした";
                }
                android.content.ContentValues done = new android.content.ContentValues();
                done.put(android.provider.MediaStore.MediaColumns.IS_PENDING, 0);
                cr.update(uri, done, null, null);
                return "ピクチャの「幾何公差ドリル」に保存しました";
            } else {
                java.io.File dir = act.getExternalFilesDir(android.os.Environment.DIRECTORY_PICTURES);
                if (dir == null) return "画像を保存できませんでした";
                if (!dir.exists()) dir.mkdirs();
                java.io.File f = new java.io.File(dir, name);
                try (java.io.FileOutputStream os = new java.io.FileOutputStream(f)) {
                    os.write(data);
                }
                return "保存しました（アプリ専用のフォルダ。アンインストールすると消えます）：" + f.getAbsolutePath();
            }
        } catch (Throwable t) {
            return "画像を保存できませんでした";
        }
    }

    /** UI スレッドで通知の許可を求める（Android 13 以降） */
    @Override
    public void run() {
        if (Build.VERSION.SDK_INT >= 33
                && act.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
            act.requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 1);
        }
    }
}
