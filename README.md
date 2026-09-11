# ピッチメイト（仮称）

熊本県内のアマチュアサッカー向けマッチングサービス。
**FC VALIANT のサイトとは別のアプリケーション**。設計の経緯は `docs/DESIGN.md`。

- チーム間のトレーニングマッチ募集・応募
- チームから個人への助っ人募集・応募

## 公開先

https://nobuyukimiyagawa.github.io/kumamoto-match/

配信は `gh-pages` ブランチ。**`npm run deploy` で書き出しと配信をまとめて行う。**

GitHub Actions による自動配信の定義は `docs/github-pages-workflow.yml` に置いてある。
現在の gh の認証に `workflow` スコープが無く push できないため、手動配信にしている。
`gh auth refresh -s workflow` を一度実行すれば、`.github/workflows/` へ移して自動化できる。

## 動かす

```bash
npm install
cp .env.local.example .env.local   # キーは空でも起動する
npm run dev                        # http://localhost:3000
```

キーが未設定でも画面は動く。地図の代わりに会場の一覧が出る。

## 構成

| | |
|---|---|
| 画面 | Next.js 16 / React 19 / TypeScript / Tailwind |
| 地図 | MapLibre GL + OpenFreeMap（鍵不要・無料） |
| データ | いまは `src/lib/mock.ts` の仮データ。次段階で Supabase |

```
src/config/site.ts   サービス名・地図の初期位置・熊本県の範囲
src/types/index.ts   型と表示ラベル
src/lib/mock.ts      仮データ（熊本の実在会場8か所）
src/components/      SearchMap / PostCard / Filters
src/app/page.tsx     探す（地図＋カード連動）
src/app/post/new/    募集する
supabase/schema.sql  データベース定義
scripts/copy-maplibre-worker.mjs  MapLibre の Worker を public/maplibre/ へ複製（dev/build 前に自動実行）
```

## デザインの決めごと

**コンセプト: 公営グラウンドのナイター掲示板。**
実データでキックオフが 17:30〜20:30 に集中している＝夜開催が主、という事実から起こした。
きれいなスポーツSNSではなく、仕事のあとに「今週末やれるか」を即判断する掲示板として作る。

面を増やさず、**夜の地にチョークの白線で区切る**。角丸は使わない。

| トークン | 値 | 役割 |
|---|---|---|
| `--night` / `--night-2` / `--night-3` | `#151a18` / `#1c2321` / `#232b29` | 地・面・押された面 |
| `--chalk` | `#f4f1e8` | 白線と文字 |
| `--chalk-38` | 透過38% | **線と装飾専用。文字に使わない**（AA不足） |
| `--chalk-sub` | 透過66% | 補助テキスト |
| `--turf` | `#3e9b67` | トレーニングマッチの標識 |
| `--cone` | `#e86f2a` | 助っ人の標識 |
| `--flood` | `#e7d15e` | 選択中・注目。**強い色はここ1つに集める** |

書体は Barlow Condensed（数字・英字。時刻が締まる）と
BIZ UDPGothic（和文。公営施設の掲示に近い実用感）。
数字を出す要素には必ず `.dsp`、案内板の小見出しには `.sign` を付ける。

種別は**色ではなく標識**で示す。カード上端の帯とラベルが判断材料で、飾りではない。

### 質感の作り方

**均一なノイズは敷かない。**題材ではなく雰囲気にしかならない。代わりに:

- **地はピッチそのもの**（`PitchLines.tsx`）。タッチライン／ハーフウェイライン／
  センターサークル／ペナルティエリア／アークを実寸比で引く。
  `feTurbulence` + `feDisplacementMap` で線だけをかすれさせる。**本文には掛けない**
- **奥行きは影ではなく光で作る。**照明は上から落ちる。面（`.panel`）は上端が明るく
  下へ落ちる。カードを大きく浮かせる影は使わない（SaaSダッシュボードに見える）
- **動きは1つだけ。**選択が移った瞬間、白線を左から引き直す（`.chalk-in`）。常時ループしない
- **カードは掲示の組版**（`.spec`）。項目名の幅を 4.2em に固定し、罫線に揃える。
  数字は `.dsp` で `tnum`/`zero` を効かせ、行送りを詰める

> ⚠️ `PitchLines` は必ず `-z-10` で背面に置く。前面に出ると全要素を覆う（実際にやった）。
> 親には `isolate` を付ける。

> ⚠️ `--turf` は `#1f6b45` → `#3e9b67` → `#45a771` と2度上げた。
> 10px の標識、および選択行の面（`--night-3`）の上で AA を満たさなかったため。
> **色を触ったら、透過を合成したうえでコントラストを測り直すこと。**

## 位置情報の扱い（厳守）

**地図に出してよいのは会場だけ。個人・チームの所在地は出さない。**
`profiles` に緯度経度のカラムを作らないことで構造的に守っている。
「近く」の基準は、利用者がその場で選んだ現在地か市区町村から計算する。

## 募集は1つのテーブルで扱う

`posts.kind` が `training_match` か `helper` かで分岐する。
テーブルを分けない。応募・メッセージの流れが共通で、二重保守になるため。

管理画面も1つ。個人が後からチームを作る、チームの人が個人として助っ人登録する、
という移行が普通に起きるため、アカウントを分けると破綻する。
課金対象はチームなので、`teams` にだけオーナーと請求先を持たせている。

## 次にやること

1. Supabase を接続（`supabase/schema.sql` を流す）
2. ログインと、募集の保存・応募の実処理
3. 通知、チーム管理
4. チームからの課金

## 用意が必要なもの

- Supabase のプロジェクト

## 制約

熊本県内限定。`src/config/site.ts` の `KUMAMOTO_BOUNDS` と
`venues` テーブルの制約の2か所で県外の座標を弾いている。
対象範囲を広げるときはこの2か所を直す。

## 地図が真っ黒になったら

MapLibre の Worker が起動していない。Turbopack は `import.meta.url` を `file://` にするため、
MapLibre 任せだと Worker の URL が空になる。対策として `scripts/copy-maplibre-worker.mjs` が
Worker と shared を `public/maplibre/` へ複製し、`SearchMap.tsx` の `setWorkerUrl` で場所を明示している。
`maplibre-gl` を更新したら `npm run build` で複製も更新される（`next build` 直叩きは不可）。
