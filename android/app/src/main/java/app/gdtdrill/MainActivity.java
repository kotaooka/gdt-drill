package app.gdtdrill;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

/**
 * 同梱した index.html を WebView で表示するだけのアクティビティ。
 * assets を https://appassets.androidplatform.net/assets/ として配信し、
 * 通常のWebページと同じオリジンで localStorage（進捗の保存）が確実に動くようにしている。
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/index.html";
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);     // localStorage を有効化（進捗の保存に必要）
        s.setMediaPlaybackRequiresUserGesture(false); // 効果音（Web Audio）をいつでも鳴らせるようにする
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        // Web から呼べる機能（リマインダー通知など）。JavaScript では window.GDTApp
        // 追加機能で問題が起きてもアプリの起動は止めず、内容をトーストで表示する
        // Boot 画面で「セーフモードで開く」を選んだ場合は、通知などの追加機能を使わない
        final boolean safe = getIntent().getBooleanExtra("safe", false);
        if (!safe) try {
            web.addJavascriptInterface(new Bridge(this), "GDTApp");
        } catch (Throwable t) {
            showErr(t);
        }
        // アプリを更新したときなどに備えて、リマインダーの予約を毎回確認する
        if (!safe) try {
            Reminder.schedule(this);
        } catch (Throwable t) {
            showErr(t);
        }

        web.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            // WebView の描画プロセスが止まってもアプリを落とさず、内容を記録して Boot 画面へ戻る
            @Override
            public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
                App.saveCrash(MainActivity.this, "WebView の描画処理が停止しました（didCrash=" + detail.didCrash() + "）");
                startActivity(new Intent(MainActivity.this, Boot.class));
                finish();
                return true;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (HOST.equals(uri.getHost())) return false;
                // アプリ外のリンクは外部ブラウザで開く
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (ActivityNotFoundException ignored) {
                }
                return true;
            }
        });

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(START_URL);
        }
    }

    /** 戻るボタン：画面内の履歴（タブの移動など）があれば戻り、なければ閉じる */
    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    private void showErr(Throwable t) {
        try {
            android.widget.Toast.makeText(this, t.toString(), android.widget.Toast.LENGTH_LONG).show();
        } catch (Throwable ignored) {
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }
}
