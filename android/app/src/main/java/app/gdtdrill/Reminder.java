package app.gdtdrill;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/**
 * 毎日のリマインダー通知。
 * ・設定（オン／オフ、時刻）と今日の解答状況は、Web 側から Bridge 経由で SharedPreferences に保存される。
 * ・指定時刻に、今日の目標をまだ達成していなければ通知する（達成済みなら通知しない）。
 * ・通知を出したら翌日の同時刻を予約し直す。端末の再起動後も予約し直す。
 * ・正確なアラームの権限は不要な setAndAllowWhileIdle を使う（数分程度ずれることがある）。
 */
public class Reminder extends BroadcastReceiver {
    static final String PREFS = "gdt";
    static final String CHANNEL = "daily";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            schedule(ctx);
            return;
        }
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!p.getBoolean("on", false)) return;
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        int goal = p.getInt("goal", 10);
        int done = today.equals(p.getString("day", "")) ? p.getInt("today", 0) : 0;
        int streak = p.getInt("streak", 0);
        if (done < goal) notify(ctx, message(goal - done, streak));
        schedule(ctx);
    }

    static String message(int left, int streak) {
        if (streak > 0) return "連続" + streak + "日の記録がかかっています。今日の目標まで、あと" + left + "問。";
        return "今日の目標まで、あと" + left + "問。5分だけ解いてみませんか？";
    }

    static void notify(Context ctx, String text) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.createNotificationChannel(new NotificationChannel(CHANNEL, "毎日のリマインダー", NotificationManager.IMPORTANCE_DEFAULT));
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        int icon = ctx.getResources().getIdentifier("ic_notify", "drawable", ctx.getPackageName());
        Notification n = new Notification.Builder(ctx, CHANNEL)
                .setSmallIcon(icon)
                .setContentTitle("幾何公差ドリル")
                .setContentText(text)
                .setAutoCancel(true)
                .setContentIntent(pi)
                .build();
        nm.notify(1, n);
    }

    /** 設定に従って次回の通知を予約する（オフなら予約を取り消す） */
    static void schedule(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = PendingIntent.getBroadcast(ctx, 0, new Intent(ctx, Reminder.class),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        am.cancel(pi);
        if (!p.getBoolean("on", false)) return;
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, p.getInt("h", 20));
        c.set(Calendar.MINUTE, p.getInt("m", 0));
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        if (c.getTimeInMillis() <= System.currentTimeMillis()) c.add(Calendar.DATE, 1);
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, c.getTimeInMillis(), pi);
    }
}
