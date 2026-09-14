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
| データ | `src/lib/store.ts`（localStorage）。初期値は `src/lib/mock.ts`。次段階で Supabase に差し替え |

```
src/config/site.ts   サービス名・地図の初期位置・熊本県の範囲
src/types/index.ts   型と表示ラベル
src/lib/mock.ts      仮データ（熊本の実在会場8か所）
src/lib/store.ts     データ層。読み書きはここだけ（Supabase 移行時に中身を差し替える）
src/components/      Header / BottomNav / SearchMap / VenueMap / PostCard / Filters / Stars / ApplicantRow
src/app/page.tsx     探す（地図＋カード連動、距離絞り込み）
src/app/post/        募集詳細（エントリー／承認）  ※ /post/?id=xxx
src/app/post/new/    募集する
src/app/me/          マイページ（チーム管理／自分のエントリー／評価）
src/app/team/new/    チームを作る
supabase/schema.sql  データベース定義
scripts/copy-maplibre-worker.mjs  MapLibre の Worker を public/maplibre/ へ複製（dev/build 前に自動実行）
```

## デザインの決めごと

**使いやすさを最優先にする。** VARIANT のトンマナに合わせる必要はない（2026-09-14 決定）。
以前の「ナイター掲示板」調（黒地・10px の英字見出し・横スクロールのカード）は、
スマホで読めない・押せない・スクロールに気づけないため廃止した。

- 明るい地に濃い文字。本文 14〜15px、主要情報（日時・チーム名）16〜18px
- 押せるものは高さ 40px 以上（チップ 40 / ボタン 44 / 入力欄 46）
- 色に持たせる意味は3つだけ: 種別（青=トレーニングマッチ / 橙=助っ人）、選択中と行動（緑）、エラー（赤）
- 略語を使わない。「TM」ではなく「トレーニングマッチ」
- 書体は BIZ UDPGothic のみ。数字は `.num` で桁を揃える

### 画面の組み方

- スマホ: 上に地図（36vh）、その下に絞り込み1行（横スクロール、右端をぼかして続きを示す）、縦のカード一覧
- PC（768px〜）: 左にリスト（30rem、絞り込みは段組み）、右に地図
- ピンを押すとカードへスクロール、カードを押すとピンを強調して会場が画面外なら寄せる
- 絞り込みを変えたら選択は外す（勝手に先頭へ飛ばない）

### 地図

- OpenFreeMap `liberty`（標準的なカラー地図、鍵不要）
- 地名は `name:ja` を優先（`applyJapaneseLabels`）
- 現在地ボタン（右上）。押したときだけ位置情報を使う
- 「現在地から◯km以内」を選ぶと、その場で現在地を取り、円を描いて範囲に寄せる。
  取れなければ理由を赤字で出して「指定なし」に戻す。距離は `src/lib/geo.ts`（球面近似）


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
