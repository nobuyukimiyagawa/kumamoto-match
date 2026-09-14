# ログイン設定の手順（Google / LINE）

> **2026-09-14 状況**: メール / Google / LINE の3方式とも本番で動作確認済み。
> - Google: Google Cloud プロジェクト `pitchmate-508613`、OAuth クライアント `pitchmate-web`
> - LINE: プロバイダー「ピッチメイト」、LINE ログインチャネル ID `2011602303`（公開済み）
> - Edge Function `line-auth` はダッシュボードから配置（Verify JWT = OFF）、secrets 3件設定済み
> - 画面は /signup/（新規登録）と /login/（ログイン）に分離。認証後は /auth/done/ で
>   プロフィール有無と intent（localStorage `pitchmate-auth-intent`）を見て /welcome/ か /me/ へ。
>   Supabase の Redirect URLs に `https://nobuyukimiyagawa.github.io/kumamoto-match/**` を追加済み
> - LINE のメールアドレス取得権限は 2026-09-14 に申請済み（承認待ち）。承認前に LINE で
>   ログインした人は `line_<id>@line.pitchmate.invalid` の代替アドレスで別ユーザーになる。
>   承認後は scope に email が入っているので自動で統合される（追加作業なし）

方針: **見るだけならログイン不要。募集する・エントリーする・マイページはログイン必須。**
ログイン手段は メール＋パスワード / Google / LINE の3つ（2026-09-14 にマジックリンクからパスワード方式へ変更）。
- 新規登録: メール＋パスワード（8文字以上）→ 確認メールのリンクで有効化 → /auth/done/ → /welcome/
- パスワード再設定: /auth/forgot/ でメール送信 → リンクで /auth/reset/ → 新パスワード保存
- Google / LINE はパスワード無し

Supabase プロジェクト: https://supabase.com/dashboard/project/hyzvldrmasniedxsiohh
本番サイト: https://nobuyukimiyagawa.github.io/kumamoto-match/

---

## 1. Google ログイン（Supabase 標準）

### 1-1. Google Cloud で OAuth クライアントを作る（宮川さんの Google アカウント）

1. https://console.cloud.google.com/ を開き、プロジェクトを新規作成（名前は「pitchmate」など）
2. 左メニュー「API とサービス → OAuth 同意画面」
   - User Type: **外部** → 作成
   - アプリ名: ピッチメイト / サポートメール: 自分のアドレス / デベロッパー連絡先: 自分のアドレス
   - スコープは追加不要（email / profile は既定）→ 保存
   - 「公開ステータス」を **本番環境に公開**（テスト状態だと100人まで、しかもテストユーザー登録が要る）
3. 「API とサービス → 認証情報 → 認証情報を作成 → OAuth クライアント ID」
   - アプリケーションの種類: **ウェブ アプリケーション**
   - 名前: pitchmate-web
   - 承認済みのリダイレクト URI に次を1つ追加:
     `https://hyzvldrmasniedxsiohh.supabase.co/auth/v1/callback`
   - 作成 → **クライアント ID** と **クライアント シークレット** が表示される（あとで使う）

### 1-2. Supabase に登録する

1. https://supabase.com/dashboard/project/hyzvldrmasniedxsiohh/auth/providers を開く
2. **Google** を開いて「Enable Sign in with Google」を ON
3. Client ID と Client Secret を貼る → Save

以上で、サイトの「Google でログイン」が動く。

---

## 2. LINE ログイン（Edge Function で自作）

### 2-1. LINE Developers でチャネルを作る（宮川さんの LINE アカウント）

1. https://developers.line.biz/console/ にログイン（LINE アカウントで可）
2. プロバイダーを作成（名前は「ピッチメイト」など）
3. 「新規チャネル作成 → **LINE ログイン**」
   - チャネル名: ピッチメイト / 説明: 熊本のサッカーマッチング / アプリタイプ: **ウェブアプリ**
   - メールアドレス: 自分のアドレス
4. 作成後、チャネルの「LINE ログイン設定」タブ
   - コールバック URL に次を登録:
     `https://hyzvldrmasniedxsiohh.supabase.co/functions/v1/line-auth/callback`
5. 「チャネル基本設定」タブ
   - **チャネル ID** と **チャネルシークレット** を控える
   - 「メールアドレス取得権限」を **申請**（利用目的の説明とスクショが要る。無くても動くが、
     その場合はメールが取れないので代替アドレスでユーザーを作る）
6. チャネルを **公開** にする（開発中のままだと管理者しかログインできない）

### 2-2. Edge Function を配置する

`supabase/functions/line-auth/index.ts` が本体。配置は次のどちらか。

**A. ターミナル（個人アクセストークンが要る）**

```bash
# 初回だけ
npx supabase login            # ブラウザでトークンを発行して貼る
npx supabase link --project-ref hyzvldrmasniedxsiohh

# secrets を入れる
npx supabase secrets set LINE_CHANNEL_ID=xxxx LINE_CHANNEL_SECRET=xxxx \
  SITE_URL=https://nobuyukimiyagawa.github.io/kumamoto-match/

# 配置（JWT 検証を切る。LINE からの戻りは Supabase のトークンを持っていないため）
npx supabase functions deploy line-auth --no-verify-jwt
```

**B. ダッシュボード**

1. https://supabase.com/dashboard/project/hyzvldrmasniedxsiohh/functions → 「Deploy a new function → Via Editor」
2. 名前 `line-auth`、index.ts の中身を貼って Deploy
3. 関数の設定で **Verify JWT を OFF**
4. 「Edge Functions → Secrets」に `LINE_CHANNEL_ID` `LINE_CHANNEL_SECRET` `SITE_URL` を追加

以上で、サイトの「LINE でログイン」が動く。

### 仕組み（メモ）

```
サイト「LINEでログイン」
  → /functions/v1/line-auth/start?return=<サイト>/auth/line/
  → LINE の認可画面 → 許可
  → /functions/v1/line-auth/callback?code=...
      code をトークンに交換 → id_token を LINE に検証 → sub/name/email
      auth.users に無ければ作成（app_metadata.line_sub に LINE の ID）
      generateLink(magiclink) で token_hash を発行（メールは送らない）
  → <サイト>/auth/line/?token_hash=...
      verifyOtp({ token_hash, type: "magiclink" }) でセッション → /me へ
```

メールが取れない LINE ユーザーは `line_<sub>@line.pitchmate.invalid` という代替アドレスで
作られる。本人には見せない。後で同じメールの Google ログインと統合したい場合は、
auth.users を手で結合する必要がある（未対応）。
