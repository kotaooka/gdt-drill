package app.gdtdrill;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/**
 * 起動の入口。前回エラーで落ちていなければ、そのまま本体（MainActivity）を開く。
 * 落ちていた場合はエラー内容を表示し、「セーフモードで開く」（通知などの追加機能を使わない）を選べるようにする。
 */
public class Boot extends Activity implements View.OnClickListener {
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        SharedPreferences p = getSharedPreferences("crash", MODE_PRIVATE);
        String trace = p.getString("trace", null);
        if (trace == null) {
            open(false);
            return;
        }
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(40, 80, 40, 40);
        TextView msg = new TextView(this);
        msg.setText("前回、アプリがエラーで終了しました。下の内容をスクリーンショットして送ってください。\n\n" + trace);
        msg.setTextIsSelectable(true);
        msg.setTextSize(12);
        Button safe = new Button(this);
        safe.setText("セーフモードで開く（通知などを使わない）");
        safe.setTag("safe");
        safe.setOnClickListener(this);
        Button normal = new Button(this);
        normal.setText("通常どおり開く");
        normal.setTag("normal");
        normal.setOnClickListener(this);
        box.addView(safe);
        box.addView(normal);
        box.addView(msg);
        ScrollView sv = new ScrollView(this);
        sv.addView(box);
        setContentView(sv);
    }

    @Override
    public void onClick(View v) {
        getSharedPreferences("crash", MODE_PRIVATE).edit().remove("trace").commit();
        open("safe".equals(v.getTag()));
    }

    private void open(boolean safe) {
        Intent i = new Intent(this, MainActivity.class);
        i.putExtra("safe", safe);
        startActivity(i);
        finish();
    }
}
