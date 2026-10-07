package app.gdtdrill;

import android.app.Application;

import java.io.PrintWriter;
import java.io.StringWriter;

/**
 * 予期しないエラーでアプリが落ちたとき、その内容（スタックトレース）を保存する。
 * 次の起動時に Boot 画面で表示し、セーフモードで開けるようにする。
 */
public class App extends Application implements Thread.UncaughtExceptionHandler {
    private Thread.UncaughtExceptionHandler prev;

    @Override
    public void onCreate() {
        super.onCreate();
        prev = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler(this);
    }

    @Override
    public void uncaughtException(Thread t, Throwable e) {
        try {
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            saveCrash(this, sw.toString());
        } catch (Throwable ignored) {
        }
        if (prev != null) prev.uncaughtException(t, e);
    }

    static void saveCrash(android.content.Context ctx, String text) {
        ctx.getSharedPreferences("crash", MODE_PRIVATE).edit().putString("trace", text).commit();
    }
}
