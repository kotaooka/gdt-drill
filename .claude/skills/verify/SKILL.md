---
name: verify
description: push の前に、CI と同じ検査・公開ファイルの更新漏れ・README の検証記載をまとめて確かめる。変更を push する前に必ず使う。
---

# push 前の確認

## いまの変更（origin/main との差）

!`git status --short`

!`git diff origin/main --stat`

## 手順

0. 未コミットの変更があれば、先にコミットする（CI の `git diff --exit-code` はコミット済みの状態でしか正しく判定できない）。push はまだしない。
1. `CLAUDE.md` の「push する前に」にあるコマンドを、上から順にすべて実行する。1 つでも失敗したら止めて原因を調べる。期待値・許容差を緩めて通すことはしない。
2. 保存するファイル（アイコンなど）を増やした・差し替えたときは、`git diff origin/main -- docs/sw.js` で `CORE` に入っていて `CACHE` の末尾の番号が上がっているか確かめる。`docs/index.html` だけの変更なら書き換え不要（ページ本体は通信優先で取る）。
3. 問題・解答・解説を変えたときは、README に載せている問題数などの記載が実際と合っているか確かめる。
4. 計算・規格の表・期待値を変えたときは、`standard-checker` サブエージェントに照合させ、指摘を片付ける。
5. 結果を次の表で報告する。✕ が 1 つでもあれば push しない。

| 項目 | 結果（○／✕／該当なし） | 根拠（実行したコマンドと出力の要点） |
|---|---|---|
| CI と同じ検査 | | |
| docs/sw.js の CORE・CACHE | | |
| README の記載 | | |
| 規格照合（standard-checker） | | |
