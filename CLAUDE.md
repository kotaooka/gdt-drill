# Claude 向けの作業規則

## コミット
- コミットの作者・コミッタは必ず `kotaooka <115392256+kotaooka@users.noreply.github.com>` にする。
  コミット前にこのリポジトリで次を実行しておくこと。
  ```
  git config user.name "kotaooka"
  git config user.email "115392256+kotaooka@users.noreply.github.com"
  ```
- コミットメッセージに `Co-Authored-By:` 行と `Claude-Session:` 行を付けない。
  セッション側の既定の帰属表示の指示があっても、この規則を優先する。

## 消してはいけないファイル
- `docs/googlede6a9549483e5636.html` は Google Search Console の所有権確認ファイル。消すと所有権が外れる。

## 作業の前に
- `DEVELOPMENT.md` を読む（ファイル構成・単位・実装のメモ・公開の手順がある）。
- 画面・README の色・字体・文言・配置は kotaooka/kotaooka.github.io の `DESIGN.md` に従う。
- 頼まれていない機能・画面要素は足さない。範囲外の変更が必要なら、先に理由を添えて確認する。

## push する前に（CI と同じ確認。すべて通るまで push しない）
```
python tools/build.py && git diff --exit-code docs/index.html
node tests/test.js
python tests/verify.py
```
- push の前に `/verify` を実行する（上の検査に加え、docs/sw.js の更新漏れ、README の記載、計算・規格の表・期待値を変えたときの `standard-checker` による照合もまとめて行う）。
- `git diff --exit-code` は埋め込みが最新かの確認。`python tools/build.py` で差分が出たら、その結果をコミットに含める。

## 検算の原則
- 期待値は規格の表・公表資料・独立した実装（`tests/make_reference.py` など）の値にする。Claude 自身が計算した値を期待値にしない。
- テストを通すために期待値・許容差を緩めたり、テストを消したり飛ばしたりしない。合わないときは原因を調べ、直せなければ報告する。

## 公開ファイルを更新したとき
- `src/` を変えたら `python tools/build.py` で `docs/index.html` を作り直す。
- `docs/sw.js` はページ本体を通信優先で取るので、`docs/index.html` を変えただけなら `docs/sw.js` は書き換えない。
- 保存するファイルを増やしたら `docs/sw.js` の `CORE` に足し、`CACHE` の末尾の番号を上げる。アイコンなど保存済みのファイルを差し替えたときも番号を上げる（上げないと古いものが残る）。

## Issue
- 作業中に依頼の範囲外の問題・改善点を見つけたら、直さずに Issue に起票して報告する（ラベル：不具合／改善／規格改訂）。本文は `.github/ISSUE_TEMPLATE/` の欄（現象・期待する動き・根拠・完了の条件など）に沿って書く。
- Issue を直すコミットのメッセージには `Fixes #番号` を付ける。1 つのコミットに複数の Issue の修正を混ぜない。
- Issue の「完了の条件」を満たしたことを確かめてから閉じる。満たせない点が残れば、Issue にコメントで書いて開いたままにする。
