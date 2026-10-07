# 開発者向け情報

アプリの仕組み、ビルド、テスト、問題の追加、リリースの手順です。利用方法は [README.md](README.md) を参照してください。

## 構成

画面・問題・数値表は `src/` に分かれており、`tools/build.py` で1つの HTML（`docs/index.html`）にまとめます。この HTML が Web 版（GitHub Pages）で、Android アプリにも同梱されます。画面側は外部ライブラリを使わず、解答記録は端末内（localStorage）だけに保存します。外部と通信するのは、設定の「更新の確認」で GitHub の API（最新リリースの版名）を読むときだけです（「GitHub で報告」や各種リンクは、ブラウザで GitHub などのページを開くだけです）。

Web 版は `docs/sw.js`（Service Worker）で、一度開いたあとはオフラインでも起動できます。ページ本体は通信を優先して取得するので、`docs/index.html` を更新しても `sw.js` を書き換える必要はありません。保存するファイルを増やしたときだけ、`sw.js` の `CORE` と `CACHE` の名前（`gdt-drill-v1` → `v2`）を変えてください。Android アプリでは Service Worker を登録しません。

```
src/
  template.html   画面（HTML・CSS・アプリ本体の JavaScript）
  bank.js         分野（FIELDS）・小分類（CATS）・実力診断の問数（DIAG）・知識問題（KB）
  gen.js          計算問題ジェネレータと共通関数
  dai.js          総合問題（図面を読む大問の穴埋め・正誤）
  path.js         学習ロードの章・ステージ・ストーリー
  figs.js         図（公差記入枠・データム記号・部品図・公差域）と、記号の SVG
  formulas.js     公式集（早見表の「公式」）
  lab.js          動く図（資料タブ。LABS にウィジェット、LABFOR で分類から解説へのリンク）
  play.js         記号フラッシュ・実績（バッジ）・実力診断の結果の画像
  reader.js       記入枠を読む（資料タブ。意味・公差域・測り方の文と、不適切な指示の判定 rdIssues）
  search.js       検索（索引 srIndex、言い換え SR_SYN）
  syllabus.js     出題範囲の項目と、各項目に対応する問題の割り当て
  res.js          バージョン・更新履歴、資料タブのリンク・関連規格、早見表（QREF）、普通幾何公差の表（B0419）
tools/
  build.py        src/ をまとめて docs/index.html を生成
tests/
  test.js         計算問題を各3,000回生成し、選択肢の重複・非数値・図の不備・出題範囲の抜けを検査
  verify.py       計算問題の正解を問題文の数値から独立に計算し直して照合（普通幾何公差の表も別に持って照合）
  lenbias.js      知識問題の選択肢の長さの偏り・否定形の割合を計測
  calcbias.js     計算問題で正解が選択肢の何番目の大きさかの分布を計測（同値は按分）
docs/
  index.html      ビルド結果（GitHub Pages の公開対象、APK にも同梱）
  manifest.webmanifest, sw.js, icons/  Web 版をホーム画面に追加（PWA）するためのファイル（手で管理）
android/          Android アプリ（WebView で docs/index.html を表示）
screenshots/      README・SNS 共有用の画像
```

## ビルドとテスト

必要なもの：Python 3、Node.js（外部パッケージは不要）。コマンドはリポジトリ直下で実行します。

```powershell
python tools/build.py          # docs/index.html を生成
node tests/test.js             # 生成・整合性の検査（検算用の tests/samples.json もここで作る）
python tests/verify.py         # 計算問題の正解の照合（test.js の後に実行）
node tests/lenbias.js          # 選択肢の長さの偏り（目安：最長・最短とも 25% 前後）
```

`src/` を編集したら `python tools/build.py` を実行し、`docs/index.html` も一緒にコミットしてください。`main` への push で GitHub Actions（`.github/workflows/test.yml`）が同じ検査を行い、`docs/index.html` がビルド結果と一致しているかも確認します。

## 問題の追加

**知識問題**：`src/bank.js` の `KB` に次の形式で追加します。選択肢は先頭が正解で、表示時にシャッフルされます。分類キーは `CATS` を参照してください。

```js
['分類キー', '問題文', ['正解', '誤答1', '誤答2', '誤答3'], '解説', 元のID（省略可）, 問題の図（省略可）],
```

- 図は `['図の名前', {引数}]` で指定します。図の名前と引数は `src/figs.js` の `FIG`（`fcf`・`plate`・`block`・`shaft`・`leader`・`pos`・`dyn`・`zone`）を参照してください。
- 解説は最初の1文が「要点」として太字で表示され、残りは「詳しく」に入ります。
- 正解の選択肢だけが長く（短く）ならないようにしてください。`node tests/lenbias.js` で偏りを確認できます。
- 問題文を変えると解答記録の ID が変わります。既存の問題文を直すときは、5番目の要素に元の ID（元の問題文の `hash()` 値）を書くと、記録を引き継げます。
- 規格の本文や図は転載せず、自分の言葉と描き起こしの図で書いてください。

**計算問題**：`src/gen.js` の `G` に、`{q: 問題文, ch: [正解, 誤答...], ex: 解説, fig: 問題の図, exfig: 解説の図}` を返す関数として追加します。選択肢は共通関数 `mc()` で作ると、正解の大小の位置が毎回ランダムになります。記号の識別のように計算ではない生成問題は `nocalc:true` を付けると「計算」の表示が出ません。追加したら `tests/verify.py` に独立の検算を足し、`tests/test.js` のサンプル出力の一覧にも ID を加えてください。

**公差記入枠の組み立て**：`src/dai.js` に `type:'fcf'` の大問として追加します。`opts` のうち `'@pos'` のように `@` で始まるものは幾何特性の記号（`src/figs.js` の `SYMP` のキー）、`'(M)'` は Ⓜ、`'—'` は「データムを書かない」を表します。`ans` は公差記入枠の左の区画から順の正解（1番目は記号、2番目は公差値、3番目以降はデータム）で、`ex` は区画ごとの解説です。図は `fig` に `nofcf:true` を付けた部品図（`plate`・`block`・`shaft`・`shaft2`・`slot`・`curve`・`pattern`）を使うと、答えが図に出ません。

複数段の枠は `rows`（区画の番号を段ごとに並べた配列。例 `[[0,1,2,3,4],[5,6]]`）で指定します。`composite:true` にすると記号の区画を全段にまたがせ（ASME の複合公差）、下の段は公差値から始めます。`composite` がなければ、段ごとに記号から始める単一の枠を重ねます。図の公差記入枠も `['fcf',{rows:[{sym,tol,dats},...],composite}]` で描けます。

**図を本文の上に置く**：○×の大問と、図が公差記入枠だけの大問は、図を本文の上に置きます。部品図を見ながら答える穴埋めの大問には `figTop:true` を付けます。

**分野と実力診断**：分野は `FIELDS`、実力診断の分野ごとの問数は `DIAG`（いずれも `src/bank.js`）で決めます。実力診断に時間制限と合否判定はなく、結果は分野・出題範囲の項目ごとの正答率で示します。

**問題の種類**：知識・計算・図面を読む（`type` なし・`ox`）・記入枠を組む（`type:'fcf'`）・検図（`chk:true`）の5種類です。大問の種類は `xkOf()` が `dai.js` の指定から決めます。

**合否を判定する問題**：`G` の生成問題に `judge:true` を付け、選択肢を `['合格','不合格']` にします。合格・不合格がおよそ半々になるように数値を作ってください。

**出題コード**：`startMock(code)` は、コードから作った乱数で `Math.random` を一時的に置き換えて出題リストを作ります（`withSeed`）。同じ版・同じコードなら同じ問題・数値・選択肢の順になります。問題・ジェネレータを変えると同じコードでも問題が変わるので、版を上げたら受講者にも同じ版を使ってもらってください。

**検査成績書の図**：`FIG.report({cols, w, rows, mark})` で表を描きます。

**実力診断の画像**：`play.js` の `diagCanvas()` が canvas に描きます。Web 版はファイルの共有（`navigator.share`）か、ダウンロードで保存します。Android アプリは `GDTApp.saveImage(base64, ファイル名)` で、Android 10 以降は「ピクチャ／幾何公差ドリル」、8〜9 はアプリ専用の画像フォルダに保存します（ストレージの権限は不要）。氏名は localStorage の `gdt-name` に保存します。

## Android アプリ

`android/` は、`docs/index.html` を WebView で表示するアプリです。

| ファイル | 役割 |
|---|---|
| `Boot.java` | 起動の入口。前回エラーで終了していれば内容を表示し、セーフモードで開ける |
| `App.java` | 予期しないエラーの内容を保存する |
| `MainActivity.java` | WebView の表示、戻るボタン、外部リンクを外部ブラウザで開く |
| `Bridge.java` | Web から `window.GDTApp` として呼ぶ機能（通知の設定、今日の解答数の受け渡し） |
| `Reminder.java` | 毎日のリマインダー通知の予約と表示 |

権限：`INTERNET`、`POST_NOTIFICATIONS`（Android 13 以降、通知をオンにしたときに許可を求める）、`RECEIVE_BOOT_COMPLETED`（再起動後に通知を予約し直す）、`VIBRATE`。正確なアラームの権限は使わないため、通知は数分遅れることがあります。

### ビルド（GitHub Actions）

`.github/workflows/android.yml` が APK を作ります。

- `main` への push：Actions の実行結果（Artifacts）に `gdt-drill-apk` を置きます。
- リリースの公開：そのリリースに `gdt-drill.apk` を添付します。
- 版数（versionCode）は「100＋実行番号」、版名（versionName）はリリースのタグ名です。

### 署名の設定

署名鍵はリポジトリに入れていません（第三者が同じ署名の APK を作れないようにするため）。Settings → Secrets and variables → Actions に次の4つを登録します。

| 名前 | 内容 |
|---|---|
| `KEYSTORE_BASE64` | 署名鍵ファイルを Base64 にした文字列 |
| `KEYSTORE_PASSWORD` | 鍵ストアのパスワード |
| `KEY_ALIAS` | 鍵の別名 |
| `KEY_PASSWORD` | 鍵のパスワード |

```powershell
# 鍵ファイルを Base64 にしてクリップボードへ（Windows PowerShell）
[Convert]::ToBase64String([IO.File]::ReadAllBytes("E:\path\to\gdt.keystore")) | Set-Clipboard
```

手元でビルドする場合は、`android/keystore.properties`（.gitignore 済み）に `storeFile`・`storePassword`・`keyAlias`・`keyPassword` を書きます。`storeFile` は絶対パスで書いてください（相対パスは `android/app/` から見た位置になります）。鍵をなくすと、既存のアプリに上書き更新できなくなります。

## リリース手順

1. `src/res.js` の `APP.version`・`APP.date`・`history` を更新する（1行で簡潔に）。
2. `python tools/build.py` を実行し、テストを通す。
3. `git add -A`、`git commit`、`git push`。
4. GitHub の Releases で、`APP.version` に `v` を付けたタグ（例：`APP.version` が `2.0.3` なら `v2.0.3`）を作って公開する。数分後に `gdt-drill.apk` が自動で添付される。

タグ名は必ず `APP.version` と一致させてください。アプリの「更新の確認」は最新リリースのタグ名と `APP.version` を比べるため、ずれていると、最新版でも「新しい版があります」と表示され続けます。タグは `v` と数字・ピリオドだけにします（`v2.0.3-beta` などは版名として読めません）。

Web 版（GitHub Pages）は、`docs/index.html` を push した時点で更新されます。

## バージョン

`src/res.js` の `APP.version` で管理し、アプリの設定画面と最下部に表示しています。形式は `メジャー.マイナー.パッチ`（例 `2.0.3`）で、更新の確認では数字ごとに大小を比べます（`2.0.10` は `2.0.9` より新しい）。
